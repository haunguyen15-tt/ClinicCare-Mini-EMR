<script setup lang="ts">
import type { Diagnosis } from '~/types/api'

// ICD-10 autocomplete over GET /diagnosis, following the WAI-ARIA combobox pattern.
// `v-model` is the list of selected codes. With `multiple` (the default) codes collect as
// removable chips; without it a pick replaces the current code.
const props = withDefaults(
  defineProps<{
    modelValue: string[]
    /** id for the text input, so a <label for> outside the component can point at it. */
    inputId: string
    multiple?: boolean
    /** Most codes that can be selected (the backend allows 20). */
    max?: number
    invalid?: boolean
    /** id of an element describing the field, such as its error message. */
    describedby?: string
    placeholder?: string
    /** Chip descriptions for codes selected outside the picker (e.g. read from the URL). */
    labels?: Record<string, string>
    /** Options listed before the results for a search term, e.g. a code prefix. */
    extraOptions?: (term: string) => Diagnosis[]
  }>(),
  { multiple: true, max: 20, placeholder: 'e.g. E11 or asthma' },
)

const emit = defineEmits<{ 'update:modelValue': [codes: string[]] }>()

interface Option extends Diagnosis {
  /** From `extraOptions` rather than the search results. */
  extra?: true
}

const api = useApi()
const uid = useId()
const listboxId = `${uid}-listbox`
const statusId = `${uid}-status`
const optionId = (index: number) => `${uid}-option-${index}`

const field = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const query = ref('')
const search = useDebounce(() => query.value.trim(), 300)
const results = ref<Diagnosis[]>([])
const loading = ref(false)
const searchError = ref<string | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

// Extra options first, minus any that a result already covers.
const options = computed<Option[]>(() => {
  const found = new Set(results.value.map((diagnosis) => diagnosis.code))
  const extras = (props.extraOptions?.(search.value) ?? [])
    .filter((option) => !found.has(option.code))
    .map((option) => ({ ...option, extra: true as const }))
  return [...extras, ...results.value]
})

const selected = computed(() => new Set(props.modelValue))
const showList = computed(() => open.value && query.value.trim() !== '')
// True from the first keystroke until the matching response arrives.
const pending = computed(() => query.value.trim() !== search.value || loading.value)
const atMax = computed(() => props.multiple && props.modelValue.length >= props.max)
const activeId = computed(() => (showList.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined))

const status = computed(() => {
  if (!showList.value) return ''
  if (pending.value) return 'Searching…'
  if (searchError.value) return searchError.value
  if (!options.value.length) return `No codes match “${search.value}”.`
  return `${plural(options.value.length, 'option')} found. Use the arrow keys to choose.`
})

// Descriptions of codes picked here; `labels` covers the ones that came from outside.
const descriptions = reactive(new Map<string, string>())
const describe = (code: string) => descriptions.get(code) ?? props.labels?.[code]

watch(search, async (term, _previous, onCleanup) => {
  activeIndex.value = -1
  searchError.value = null
  if (!term) {
    results.value = []
    loading.value = false
    return
  }

  // A newer search cancels this one, so only the latest response is used.
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true
  try {
    const found = await api<Diagnosis[]>('/diagnosis', { query: { search: term, limit: 10 }, signal: controller.signal })
    if (!controller.signal.aborted) results.value = found
  } catch (error) {
    if (controller.signal.aborted) return
    results.value = []
    searchError.value = getErrorMessage(error)
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
})

function choose(option: Option) {
  const isSelected = selected.value.has(option.code)
  if (atMax.value && !isSelected) return
  descriptions.set(option.code, option.description)
  if (!props.multiple) {
    emit('update:modelValue', [option.code])
    query.value = ''
    open.value = false
    return
  }
  // The list stays open with the same results, so several related codes can be picked in a row.
  if (isSelected) emit('update:modelValue', props.modelValue.filter((code) => code !== option.code))
  else emit('update:modelValue', [...props.modelValue, option.code])
}

function remove(code: string) {
  emit('update:modelValue', props.modelValue.filter((selected) => selected !== code))
  input.value?.focus()
}

function move(step: 1 | -1) {
  open.value = true
  const count = options.value.length
  if (!count) return
  // From "nothing active", Down goes to the first option and Up to the last.
  activeIndex.value = activeIndex.value < 0 ? (step > 0 ? 0 : count - 1) : (activeIndex.value + step + count) % count
  nextTick(() => document.getElementById(optionId(activeIndex.value))?.scrollIntoView({ block: 'nearest' }))
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      move(event.key === 'ArrowDown' ? 1 : -1)
      break
    case 'Enter': {
      // Enter picks a code instead of submitting the surrounding form while a search is typed.
      if (!query.value.trim()) return
      event.preventDefault()
      const option = options.value[Math.max(activeIndex.value, 0)]
      if (showList.value && !pending.value && option) choose(option)
      break
    }
    case 'Escape':
      if (showList.value) {
        event.preventDefault()
        open.value = false
      } else if (query.value) {
        query.value = ''
      }
      break
    case 'Backspace':
      if (!query.value && props.multiple && props.modelValue.length) {
        emit('update:modelValue', props.modelValue.slice(0, -1))
      }
      break
  }
}

function onInput() {
  open.value = true
  activeIndex.value = -1
}

// On touch screens the on-screen keyboard covers the lower half: move the field to the top
// so the suggestions open in the space that is left.
function onFocus() {
  open.value = true
  if (window.matchMedia('(pointer: coarse)').matches) {
    setTimeout(() => field.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 300)
  }
}

// Splits an option's description around the searched words so they can be highlighted.
function highlight({ description: text, extra }: Option) {
  const term = search.value.toLowerCase()
  const start = term && !extra ? text.toLowerCase().indexOf(term) : -1
  if (start < 0) return [{ text, match: false }]
  const end = start + term.length
  return [
    { text: text.slice(0, start), match: false },
    { text: text.slice(start, end), match: true },
    { text: text.slice(end), match: false },
  ]
}
</script>

<template>
  <div ref="field" class="scroll-mt-24">
    <ul v-if="modelValue.length" class="mb-1 mt-3 flex flex-wrap gap-2" aria-label="Selected diagnoses">
      <li
        v-for="code in modelValue"
        :key="code"
        class="reveal inline-flex min-w-0 max-w-full items-center gap-2 rounded-sm border border-ink/70 bg-card py-0.5 pl-2 [animation-duration:0.3s]"
      >
        <span class="font-mono text-xs font-medium tracking-wide">{{ code }}</span>
        <span v-if="describe(code)" class="min-w-0 truncate text-sm text-ink-soft" :title="describe(code)">
          {{ describe(code) }}
        </span>
        <button
          type="button"
          class="relative grid size-8 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-danger-soft hover:text-danger"
          :aria-label="`Remove ${code}`"
          @click="remove(code)"
        >
          <IconClose class="!size-3.5" />
        </button>
      </li>
    </ul>

    <div class="relative">
      <input
        :id="inputId"
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        class="form-input pr-9"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        maxlength="100"
        enterkeyhint="search"
        :placeholder="atMax ? `Limit of ${max} codes reached` : placeholder"
        aria-autocomplete="list"
        :aria-expanded="showList"
        :aria-controls="listboxId"
        :aria-activedescendant="activeId"
        :aria-invalid="invalid"
        :aria-describedby="[statusId, describedby].filter(Boolean).join(' ')"
        @input="onInput"
        @focus="onFocus"
        @blur="open = false"
        @keydown="onKeydown"
      >

      <!-- Search icon, or a spinner while a search is pending. -->
      <span class="pointer-events-none absolute bottom-3 right-0 text-ink-faint" aria-hidden="true">
        <AppSpinner v-if="showList && pending" />
        <svg v-else class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path stroke-linecap="round" d="m13 13 4 4" />
        </svg>
      </span>

      <!-- Sized to fit above the on-screen keyboard. -->
      <div
        v-show="showList"
        class="sheet absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(20rem,42svh)] overflow-y-auto overscroll-contain"
      >
        <p v-if="status && !options.length" class="px-4 py-3.5 text-sm text-ink-soft" aria-hidden="true">
          {{ status }}
        </p>
        <!-- Listbox always in the DOM: aria-controls must point at an existing element. -->
        <ul :id="listboxId" role="listbox" :aria-multiselectable="multiple || undefined" aria-label="Diagnosis codes">
          <li
            v-for="(diagnosis, i) in options"
            :id="optionId(i)"
            :key="diagnosis.code"
            role="option"
            :aria-selected="selected.has(diagnosis.code)"
            :aria-disabled="(atMax && !selected.has(diagnosis.code)) || undefined"
            class="flex min-h-11 cursor-pointer items-baseline gap-3 border-b border-rule px-4 py-2.5 last:border-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            :class="[i === activeIndex && 'bg-accent-soft', pending && 'opacity-60']"
            @mousedown.prevent
            @mousemove="activeIndex = i"
            @click="choose(diagnosis)"
          >
            <span
              class="code-stamp shrink-0"
              :class="[diagnosis.extra && 'border-dashed', selected.has(diagnosis.code) && 'border-accent bg-accent text-card']"
            >
              {{ diagnosis.code }}{{ diagnosis.extra ? '…' : '' }}
            </span>
            <span class="min-w-0 flex-1 text-sm leading-snug text-ink-soft">
              <template v-for="(part, j) in highlight(diagnosis)" :key="j">
                <mark v-if="part.match" class="bg-transparent font-semibold text-ink">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
            <span v-if="selected.has(diagnosis.code)" class="shrink-0 font-mono text-xs text-accent">
              {{ multiple ? 'Added' : 'Chosen' }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <p :id="statusId" class="sr-only" role="status">{{ status }}</p>
    <p v-if="multiple && modelValue.length" class="mt-2 font-mono text-xs text-ink-faint">
      {{ modelValue.length }} / {{ max }} codes
    </p>
  </div>
</template>
