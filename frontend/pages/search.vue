<script setup lang="ts">
import type { Diagnosis } from '~/types/api'

useHead({ title: 'Search' })

type Mode = 'patient' | 'diagnosis'

const api = useApi()
const route = useRoute()
const router = useRouter()

const queryText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

// The URL is the source of truth (`?patient=` or `?diagnosis=`, plus `?page=`), so a search
// can be shared and survives a refresh. The inputs below write to it.
const filters = computed<ConsultationFilters | null>(() => {
  const diagnosis = queryText(route.query.diagnosis).toUpperCase()
  if (diagnosis) return { diagnosis }
  const patient = queryText(route.query.patient)
  return patient ? { patient } : null
})

const { page, data, pending, error, refresh } = useConsultationPage('search', () => filters.value)

// Replacing (not pushing) keeps typing from filling the history. A new search starts at page 1.
function search(next: ConsultationFilters) {
  router.replace({ query: { patient: next.patient || undefined, diagnosis: next.diagnosis || undefined } })
}

const mode = ref<Mode>(filters.value?.diagnosis ? 'diagnosis' : 'patient')

// Diagnosis mode reads and writes the URL directly.
const codes = computed({
  get: () => (filters.value?.diagnosis ? [filters.value.diagnosis] : []),
  set: ([diagnosis]: string[]) => search({ diagnosis }),
})

// Patient mode keeps a draft so typing is never interrupted; it reaches the URL 300 ms after
// the last keystroke, and only when it differs (so the URL's page is kept otherwise).
const patientText = ref(filters.value?.patient ?? '')
const typedPatient = useDebounce(() => patientText.value.trim(), 300)
watch(typedPatient, (patient) => {
  if (mode.value === 'patient' && patient !== (filters.value?.patient ?? '')) search({ patient })
})

// The URL changed (back/forward, a nav link): follow it. Text still being typed is left alone,
// since the URL only ever trails the debounced draft.
watch(filters, (current) => {
  if (current) mode.value = current.diagnosis ? 'diagnosis' : 'patient'
  if (mode.value === 'patient' && (current?.patient ?? '') !== typedPatient.value) patientText.value = current?.patient ?? ''
})

function setMode(next: Mode) {
  mode.value = next
  search(next === 'patient' ? { patient: patientText.value.trim() } : {})
}

const patientInput = ref<HTMLInputElement>()

function clearPatient() {
  patientText.value = ''
  search({})
  patientInput.value?.focus()
}

// Typing something shaped like a code ("E1", "E11", "E11.6") also offers that prefix itself,
// which the backend matches against every code in the group.
const CODE_PREFIX = /^[A-Z][0-9][0-9A-Z]?(\.[0-9A-Z]{0,4})?$/
const prefixLabel = (prefix: string) => `Any code starting with ${prefix}`

function prefixOption(term: string): Diagnosis[] {
  const code = term.toUpperCase()
  return CODE_PREFIX.test(code) ? [{ code, description: prefixLabel(code) }] : []
}

// The chip's description for the code in the URL (a refresh, back/forward): an exact code, or
// else a prefix. The picker prefers its own description for codes picked in it.
const { data: urlCode } = useAsyncData(
  'search-url-code',
  async () => {
    const code = filters.value?.diagnosis
    if (!code) return null
    const [match] = await api<Diagnosis[]>('/diagnosis', { query: { search: code, limit: 1 } })
    return { code, description: match?.code === code ? match.description : prefixLabel(code) }
  },
  { lazy: true, watch: [() => filters.value?.diagnosis] },
)
const labels = computed(() => (urlCode.value ? { [urlCode.value.code]: urlCode.value.description } : undefined))

const summary = computed(() => {
  if (!filters.value || !data.value) return ''
  const target = filters.value.diagnosis ? `code ${filters.value.diagnosis}` : `“${filters.value.patient}”`
  return `${plural(data.value.total, 'consultation')} for ${target}`
})

const modes: { value: Mode; label: string }[] = [
  { value: 'patient', label: 'Patient name' },
  { value: 'diagnosis', label: 'Diagnosis code' },
]
</script>

<template>
  <div class="space-y-8 sm:space-y-10">
    <PageHeader title="Search">
      Find consultations by patient or by <span class="whitespace-nowrap">ICD-10</span> code.
    </PageHeader>

    <section class="sheet sheet-margin reveal max-w-3xl py-6 pr-5 [--d:220ms] sm:py-8 sm:pr-8" aria-label="Search options">
      <fieldset>
        <legend class="eyebrow">Search by</legend>
        <!-- Native radios: arrow keys move between the two modes. -->
        <div class="mt-3 inline-flex w-full rounded-sm bg-paper-deep p-1 sm:w-auto">
          <label
            v-for="option in modes"
            :key="option.value"
            class="relative flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-[2px] px-4 text-[0.9375rem] font-medium text-ink-soft transition-colors has-[:checked]:bg-card has-[:checked]:text-ink has-[:checked]:shadow-sheet has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent sm:flex-none"
          >
            <input
              type="radio"
              name="search-mode"
              class="sr-only"
              :value="option.value"
              :checked="mode === option.value"
              @change="setMode(option.value)"
            >
            {{ option.label }}
          </label>
        </div>
      </fieldset>

      <form v-if="mode === 'patient'" class="mt-7" role="search" @submit.prevent="search({ patient: patientText.trim() })">
        <label for="search-patient" class="form-label">Patient name</label>
        <div class="relative">
          <!-- The browser's own clear button is hidden for the styled one below. -->
          <input
            id="search-patient"
            ref="patientInput"
            v-model="patientText"
            type="search"
            name="patient"
            class="form-input pr-11 [&::-webkit-search-cancel-button]:appearance-none"
            placeholder="Any part of the name"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
            maxlength="100"
          >
          <button
            v-if="patientText"
            type="button"
            class="absolute bottom-0 right-0 grid size-11 place-items-center rounded-sm text-ink-faint hover:text-ink"
            @click="clearPatient"
          >
            <span class="sr-only">Clear</span>
            <IconClose />
          </button>
        </div>
      </form>

      <div v-else class="mt-7" role="search">
        <label for="search-diagnosis" class="form-label">Diagnosis code</label>
        <DiagnosisPicker
          v-model="codes"
          input-id="search-diagnosis"
          :multiple="false"
          :extra-options="prefixOption"
          :labels="labels"
          placeholder="A code, a prefix like E11, or a condition"
          describedby="search-diagnosis-hint"
        />
        <p id="search-diagnosis-hint" class="mt-2 text-sm text-ink-faint">
          A prefix such as <span class="font-mono text-ink-soft">E11</span> finds every code in that group.
        </p>
      </div>
    </section>

    <section v-if="filters" class="space-y-5" aria-labelledby="results-heading">
      <h2 id="results-heading" class="font-mono text-xs text-ink-soft" aria-live="polite">
        <template v-if="summary">{{ summary }}</template>
        <template v-else>Searching…</template>
      </h2>

      <AppAlert v-if="error" :message="getErrorMessage(error)" title="Search failed">
        <button type="button" class="btn-quiet" @click="refresh()">Try again</button>
      </AppAlert>

      <template v-else>
        <ConsultationTable
          :consultations="data?.items ?? []"
          :loading="pending"
          caption="Search results"
        >
          <template #empty>
            <p class="empty-title">No matches.</p>
            <p class="empty-lead">
              <template v-if="filters.diagnosis">No consultation has a code starting with {{ filters.diagnosis }}.</template>
              <template v-else>No patient name contains “{{ filters.patient }}”.</template>
            </p>
          </template>
        </ConsultationTable>
        <PaginationBar :page="page" :page-size="PAGE_SIZE" :total="data?.total ?? 0" />
      </template>
    </section>

    <p v-else class="reveal max-w-md border-l-2 border-rule-strong pl-4 text-[0.9375rem] leading-relaxed text-ink-faint [--d:300ms]">
      Results show here as you type.
    </p>
  </div>
</template>
