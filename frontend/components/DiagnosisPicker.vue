<script setup lang="ts">
import type { Diagnosis } from '~/types/api'

// ICD-10 autocomplete over GET /diagnosis, following the WAI-ARIA combobox pattern.
// `v-model` is the list of selected codes. With `multiple` (the default) codes collect as
// removable chips; without it a pick replaces the current code.
const props = withDefaults(
  defineProps<{
    modelValue: string[]
    multiple?: boolean
    /** Most codes that can be selected (the backend allows 20). */
    max?: number
    /** id for the text input, so a <label for> outside the component can point at it. */
    inputId?: string
    invalid?: boolean
    /** id of an element describing the field, such as its error message. */
    describedby?: string
    placeholder?: string
  }>(),
  {
    multiple: true,
    max: 20,
    inputId: undefined,
    invalid: false,
    describedby: undefined,
    placeholder: 'e.g. E11 or asthma',
  },
)

const emit = defineEmits<{ 'update:modelValue': [codes: string[]] }>()

const api = useApi()
const uid = useId()
const fieldId = computed(() => props.inputId ?? `${uid}-input`)
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

const showList = computed(() => open.value && query.value.trim() !== '')
// True from the first keystroke until the matching response arrives.
const pending = computed(() => query.value.trim() !== search.value || loading.value)
const atMax = computed(() => props.multiple && props.modelValue.length >= props.max)
const activeId = computed(() => (showList.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined))

const status = computed(() => {
  if (!showList.value) return ''
  if (pending.value) return 'Searching…'
  if (searchError.value) return searchError.value
  if (!results.value.length) return `No codes match “${search.value}”.`
  return `${plural(results.value.length, 'code')} found. Use the arrow keys to choose.`
})

// Descriptions for the chips: kept from search results, and looked up for codes that
// arrive through v-model (e.g. from the URL on the search page).
const descriptions = reactive(new Map<string, string>())

// Responses can come back out of order; only the latest one is used.
let latestRequest = 0

watch(search, async (term) => {
  const request = ++latestRequest
  activeIndex.value = -1
  searchError.value = null
  if (!term) {
    results.value = []
    loading.value = false
    return
  }

  loading.value = true
  try {
    const found = await api<Diagnosis[]>('/diagnosis', { query: { search: term, limit: 10 } })
    if (request !== latestRequest) return
    results.value = found
    for (const diagnosis of found) descriptions.set(diagnosis.code, diagnosis.description)
  } catch (error) {
    if (request !== latestRequest) return
    results.value = []
    searchError.value = getErrorMessage(error)
  } finally {
    if (request === latestRequest) loading.value = false
  }
})

watch(
  () => props.modelValue,
  async (codes) => {
    if (import.meta.server) return
    for (const code of codes) {
      if (descriptions.has(code)) continue
      descriptions.set(code, '') // Marks the lookup as started.
      try {
        // An exact code match always ranks first.
        const [match] = await api<Diagnosis[]>('/diagnosis', { query: { search: code, limit: 1 } })
        if (match?.code === code) descriptions.set(code, match.description)
      } catch {
        // The chip just shows the code.
      }
    }
  },
  { immediate: true },
)

const isSelected = (code: string) => props.modelValue.includes(code)

function choose(diagnosis: Diagnosis) {
  descriptions.set(diagnosis.code, diagnosis.description)
  if (!props.multiple) {
    emit('update:modelValue', [diagnosis.code])
    query.value = ''
    open.value = false
    return
  }
  // The list stays open with the same results, so several related codes can be picked in a row.
  if (isSelected(diagnosis.code)) emit('update:modelValue', props.modelValue.filter((code) => code !== diagnosis.code))
  else if (!atMax.value) emit('update:modelValue', [...props.modelValue, diagnosis.code])
}

function remove(code: string) {
  emit('update:modelValue', props.modelValue.filter((selected) => selected !== code))
  input.value?.focus()
}

function move(step: 1 | -1) {
  open.value = true
  const count = results.value.length
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
      const diagnosis = results.value[Math.max(activeIndex.value, 0)]
      if (showList.value && !pending.value && diagnosis) choose(diagnosis)
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

// Splits `text` around the searched words so they can be highlighted.
function highlight(text: string) {
  const term = search.value.toLowerCase()
  const start = term ? text.toLowerCase().indexOf(term) : -1
  if (start < 0) return [{ text, match: false }]
  const end = start + term.length
  return [
    { text: text.slice(0, start), match: false },
    { text: text.slice(start, end), match: true },
    { text: text.slice(end), match: false },
  ]
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div ref="field" class="scroll-mt-24">
    <!-- Selected codes. -->
    <ul v-if="modelValue.length" class="mb-1 mt-3 flex flex-wrap gap-2" aria-label="Selected diagnoses">
      <li
        v-for="code in modelValue"
        :key="code"
        class="reveal inline-flex min-w-0 max-w-full items-center gap-2 rounded-sm border border-ink/70 bg-card py-0.5 pl-2 [animation-duration:0.3s]"
      >
        <span class="font-mono text-xs font-medium tracking-wide">{{ code }}</span>
        <span v-if="descriptions.get(code)" class="min-w-0 truncate text-sm text-ink-soft" :title="descriptions.get(code)">
          {{ descriptions.get(code) }}
        </span>
        <button
          type="button"
          class="relative grid size-8 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-danger-soft hover:text-danger"
          :aria-label="`Remove ${code}`"
          @click="remove(code)"
        >
          <svg class="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M5 5l10 10M15 5 5 15" />
          </svg>
        </button>
      </li>
    </ul>

    <div class="relative">
      <input
        :id="fieldId"
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
        <svg v-if="showList && pending" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <svg v-else class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path stroke-linecap="round" d="m13 13 4 4" />
        </svg>
      </span>

      <!-- Suggestions. Sized to fit above the on-screen keyboard. -->
      <div
        v-show="showList"
        class="sheet absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(20rem,42svh)] overflow-y-auto overscroll-contain"
      >
        <p v-if="status && !results.length" class="px-4 py-3.5 text-sm text-ink-soft" aria-hidden="true">
          {{ status }}
        </p>
        <!-- Listbox always in the DOM: aria-controls must point at an existing element. -->
        <ul :id="listboxId" role="listbox" :aria-multiselectable="multiple || undefined" aria-label="Diagnosis codes">
          <li
            v-for="(diagnosis, i) in results"
            :id="optionId(i)"
            :key="diagnosis.code"
            role="option"
            :aria-selected="isSelected(diagnosis.code)"
            :aria-disabled="(atMax && !isSelected(diagnosis.code)) || undefined"
            class="flex min-h-11 cursor-pointer items-baseline gap-3 border-b border-rule px-4 py-2.5 last:border-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            :class="[i === activeIndex && 'bg-accent-soft', pending && 'opacity-60']"
            @mousedown.prevent
            @mousemove="activeIndex = i"
            @click="choose(diagnosis)"
          >
            <span class="code-stamp shrink-0" :class="isSelected(diagnosis.code) && 'border-accent bg-accent text-card'">
              {{ diagnosis.code }}
            </span>
            <span class="min-w-0 flex-1 text-sm leading-snug text-ink-soft">
              <template v-for="(part, j) in highlight(diagnosis.description)" :key="j">
                <mark v-if="part.match" class="bg-transparent font-semibold text-ink">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
            <span v-if="isSelected(diagnosis.code)" class="shrink-0 font-mono text-xs text-accent">
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
