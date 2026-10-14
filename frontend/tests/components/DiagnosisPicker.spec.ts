import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DiagnosisPicker from '~/components/DiagnosisPicker.vue'
import type { Diagnosis } from '~/types/api'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const DIABETES: Diagnosis[] = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E10.9', description: 'Type 1 diabetes mellitus without complications' },
  { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
]

type Picker = VueWrapper<InstanceType<typeof DiagnosisPicker>>
type PickerProps = Partial<InstanceType<typeof DiagnosisPicker>['$props']>

// Mounted like `<DiagnosisPicker v-model="codes">`: every update is fed back as the new value.
async function mountPicker(props: PickerProps = {}): Promise<Picker> {
  const wrapper: Picker = await mountSuspended(DiagnosisPicker, {
    props: {
      modelValue: [],
      inputId: 'diagnoses',
      ...props,
      'onUpdate:modelValue': (codes: string[]) => wrapper.setProps({ modelValue: codes }),
    },
    attachTo: document.body,
  })
  return wrapper
}

const input = (wrapper: Picker) => wrapper.get<HTMLInputElement>('input[role="combobox"]')
const options = (wrapper: Picker) => wrapper.findAll('[role="option"]')
const optionCodes = (wrapper: Picker) => options(wrapper).map((option) => option.get('.code-stamp').text())
const chips = (wrapper: Picker) => wrapper.findAll('[aria-label="Selected diagnoses"] > li')
const status = (wrapper: Picker) => wrapper.get('[role="status"]').text()
const emitted = (wrapper: Picker) => wrapper.emitted<[string[]]>('update:modelValue')?.map(([codes]) => codes)
const press = (wrapper: Picker, key: string) => input(wrapper).trigger('keydown', { key })

// Types a search term and lets the 300 ms debounce and the API call finish.
async function search(wrapper: Picker, term: string) {
  await input(wrapper).trigger('focus')
  await input(wrapper).setValue(term)
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  api.mockReset()
  api.mockResolvedValue(DIABETES)
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('DiagnosisPicker', () => {
  it('waits until typing stops for 300 ms, then searches once with the last term', async () => {
    const wrapper = await mountPicker()

    for (const term of ['d', 'di', 'dia', 'diab']) {
      await input(wrapper).setValue(term)
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(api).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith('/diagnosis', expect.objectContaining({ query: { search: 'diab', limit: 10 } }))
  })

  it('lists the results as options and highlights the searched words', async () => {
    const wrapper = await mountPicker()

    await search(wrapper, 'type 2')

    expect(input(wrapper).attributes('aria-expanded')).toBe('true')
    expect(optionCodes(wrapper)).toEqual(['E11.9', 'E10.9', 'E11.65'])
    expect(options(wrapper)[0]!.get('mark').text()).toBe('Type 2')
    expect(status(wrapper)).toBe('3 options found. Use the arrow keys to choose.')
  })

  it('does not search for blank input', async () => {
    const wrapper = await mountPicker()

    await search(wrapper, '   ')

    expect(api).not.toHaveBeenCalled()
    expect(input(wrapper).attributes('aria-expanded')).toBe('false')
  })

  it('adds a code on click and shows it as a chip with its description', async () => {
    const wrapper = await mountPicker()
    await search(wrapper, 'diab')

    await options(wrapper)[0]!.trigger('click')

    expect(emitted(wrapper)).toEqual([['E11.9']])
    expect(chips(wrapper)).toHaveLength(1)
    expect(chips(wrapper)[0]!.text()).toContain('E11.9')
    expect(chips(wrapper)[0]!.text()).toContain('Type 2 diabetes mellitus without complications')
    expect(options(wrapper)[0]!.attributes('aria-selected')).toBe('true')
  })

  it('picks codes with the arrow keys and Enter, keeping the list open for more', async () => {
    const wrapper = await mountPicker()
    await search(wrapper, 'diab')

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    expect(input(wrapper).attributes('aria-activedescendant')).toBe(options(wrapper)[1]!.attributes('id'))
    await press(wrapper, 'Enter')
    await press(wrapper, 'ArrowUp')
    await press(wrapper, 'Enter')

    expect(emitted(wrapper)).toEqual([['E10.9'], ['E10.9', 'E11.9']])
    expect(input(wrapper).attributes('aria-expanded')).toBe('true')
  })

  it('goes from nothing active to the last option with ArrowUp', async () => {
    const wrapper = await mountPicker()
    await search(wrapper, 'diab')

    await press(wrapper, 'ArrowUp')

    expect(input(wrapper).attributes('aria-activedescendant')).toBe(options(wrapper)[2]!.attributes('id'))
  })

  it('removes a code by picking a selected option again', async () => {
    const wrapper = await mountPicker({ modelValue: ['E11.9', 'E10.9'] })
    await search(wrapper, 'diab')

    await options(wrapper)[0]!.trigger('click')

    expect(emitted(wrapper)).toEqual([['E10.9']])
  })

  it('removes a chip with its remove button and puts focus back in the input', async () => {
    const wrapper = await mountPicker({ modelValue: ['E11.9', 'E10.9'] })

    await wrapper.get('button[aria-label="Remove E11.9"]').trigger('click')

    expect(emitted(wrapper)).toEqual([['E10.9']])
    expect(chips(wrapper).map((chip) => chip.get('.font-mono').text())).toEqual(['E10.9'])
    expect(document.activeElement).toBe(input(wrapper).element)
  })

  it('removes the last chip with Backspace in an empty input', async () => {
    const wrapper = await mountPicker({ modelValue: ['E11.9', 'E10.9'] })

    await press(wrapper, 'Backspace')

    expect(emitted(wrapper)).toEqual([['E11.9']])
  })

  it('closes the list with Escape, then clears the input with a second Escape', async () => {
    const wrapper = await mountPicker()
    await search(wrapper, 'diab')

    await press(wrapper, 'Escape')
    expect(input(wrapper).attributes('aria-expanded')).toBe('false')
    expect(input(wrapper).element.value).toBe('diab')

    await press(wrapper, 'Escape')
    expect(input(wrapper).element.value).toBe('')
  })

  it('replaces the code instead of adding one when multiple is off', async () => {
    const wrapper = await mountPicker({ modelValue: ['E10.9'], multiple: false })
    await search(wrapper, 'diab')

    await options(wrapper)[0]!.trigger('click')

    expect(emitted(wrapper)).toEqual([['E11.9']])
    expect(input(wrapper).element.value).toBe('')
    expect(input(wrapper).attributes('aria-expanded')).toBe('false')
  })

  it('blocks new codes once max is reached', async () => {
    const wrapper = await mountPicker({ modelValue: ['E11.9'], max: 1 })
    await search(wrapper, 'diab')

    expect(options(wrapper)[1]!.attributes('aria-disabled')).toBe('true')
    await options(wrapper)[1]!.trigger('click')

    expect(emitted(wrapper)).toBeUndefined()
    expect(input(wrapper).attributes('placeholder')).toBe('Limit of 1 codes reached')
  })

  it('lists extra options first, without repeating codes the results already have', async () => {
    const wrapper = await mountPicker({
      extraOptions: (term: string) => [
        { code: term.toUpperCase(), description: `Any code starting with ${term.toUpperCase()}` },
        { code: 'E11.9', description: 'Duplicate of a result' },
      ],
    })

    await search(wrapper, 'e11')

    expect(optionCodes(wrapper)).toEqual(['E11…', 'E11.9', 'E10.9', 'E11.65'])
  })

  it('shows chip descriptions passed in through labels', async () => {
    const wrapper = await mountPicker({ modelValue: ['J45.909'], labels: { 'J45.909': 'Unspecified asthma' } })

    expect(chips(wrapper)[0]!.text()).toContain('Unspecified asthma')
  })

  it('says so when nothing matches', async () => {
    api.mockResolvedValue([])
    const wrapper = await mountPicker()

    await search(wrapper, 'zzz')

    expect(options(wrapper)).toHaveLength(0)
    expect(status(wrapper)).toBe('No codes match “zzz”.')
  })

  it('shows an API error in place of the results', async () => {
    api.mockRejectedValue(createError({ statusCode: 500 }))
    const wrapper = await mountPicker()

    await search(wrapper, 'diab')

    expect(status(wrapper)).toBe('Something went wrong on the server. Please try again.')
  })

  it('cancels an older search, so a late response cannot replace newer results', async () => {
    let answerFirst: (found: Diagnosis[]) => void = () => {}
    api.mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
    api.mockResolvedValueOnce([DIABETES[1]])
    const wrapper = await mountPicker()

    await search(wrapper, 'diab')
    await search(wrapper, 'type 1')
    answerFirst(DIABETES)
    await flushPromises()

    expect(api.mock.calls[0]![1].signal.aborted).toBe(true)
    expect(optionCodes(wrapper)).toEqual(['E10.9'])
  })
})
