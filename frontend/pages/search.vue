<script setup lang="ts">
import type { ConsultationList, ConsultationQuery } from '~/types/api'

useHead({ title: 'Search · ClinicCare' })

type Mode = 'patient' | 'diagnosis'

const api = useApi()
const route = useRoute()
const router = useRouter()

const queryText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

// The URL is the source of truth (`?patient=` or `?diagnosis=`, plus `?page=`), so a search
// can be shared and survives a refresh. The inputs below write to it.
const filters = computed<Pick<ConsultationQuery, 'patient' | 'diagnosis'> | null>(() => {
  const diagnosis = queryText(route.query.diagnosis).toUpperCase()
  if (diagnosis) return { diagnosis }
  const patient = queryText(route.query.patient)
  return patient ? { patient } : null
})
const page = computed(() => pageFromQuery(route.query.page))

const mode = ref<Mode>(filters.value?.diagnosis ? 'diagnosis' : 'patient')
const patientText = ref(filters.value?.patient ?? '')
const codes = ref<string[]>(filters.value?.diagnosis ? [filters.value.diagnosis] : [])
const typedPatient = useDebounce(() => patientText.value.trim(), 300)

// Replacing (not pushing) keeps typing from filling the history. A new search starts at page 1.
function search(next: Pick<ConsultationQuery, 'patient' | 'diagnosis'>) {
  router.replace({ query: { patient: next.patient || undefined, diagnosis: next.diagnosis || undefined } })
}

watch(typedPatient, (patient) => {
  if (mode.value === 'patient') search({ patient })
})
watch(codes, ([diagnosis]) => search({ diagnosis }))

const patientInput = ref<HTMLInputElement>()

function clearPatient() {
  patientText.value = ''
  search({})
  patientInput.value?.focus()
}

function setMode(next: Mode) {
  mode.value = next
  search(next === 'patient' ? { patient: patientText.value.trim() } : { diagnosis: codes.value[0] })
}

// Back/forward or a nav link changed the URL: bring the inputs in line. Our own updates
// already match, so text still being typed is not overwritten.
watch(filters, (current) => {
  if (current?.diagnosis) {
    mode.value = 'diagnosis'
    if (codes.value[0] !== current.diagnosis) codes.value = [current.diagnosis]
  } else if (mode.value === 'patient' && (current?.patient ?? '') !== typedPatient.value) {
    patientText.value = current?.patient ?? ''
  }
  if (!current && mode.value === 'diagnosis' && codes.value.length) codes.value = []
})

const { data, status, error, refresh } = useAsyncData(
  'search',
  () => filters.value
    ? api<ConsultationList>('/consultation', {
        query: { ...filters.value, skip: (page.value - 1) * PAGE_SIZE, limit: PAGE_SIZE },
      })
    : Promise.resolve(null),
  { lazy: true, watch: [filters, page] },
)

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
    <header class="max-w-2xl">
      <p class="eyebrow reveal">Records · {{ tabNumber(2) }}</p>
      <h1 class="page-title reveal mt-3 [--d:80ms]">Search</h1>
      <p class="reveal mt-3 text-[0.9375rem] text-ink-soft [--d:160ms]">
        Find consultations by patient or by <span class="whitespace-nowrap">ICD-10</span> code.
      </p>
    </header>

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
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" d="M5 5l10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
      </form>

      <div v-else class="mt-7" role="search">
        <label for="search-diagnosis" class="form-label">Diagnosis code</label>
        <DiagnosisPicker
          v-model="codes"
          input-id="search-diagnosis"
          :multiple="false"
          allow-prefix
          placeholder="A code, a prefix like E11, or a condition"
          describedby="search-diagnosis-hint"
        />
        <p id="search-diagnosis-hint" class="mt-2 text-sm text-ink-faint">
          A prefix such as <span class="font-mono text-ink-soft">E11</span> finds every code in that group.
        </p>
      </div>
    </section>

    <!-- Results. -->
    <section v-if="filters" class="space-y-5" aria-labelledby="results-heading">
      <h2 id="results-heading" class="font-mono text-xs text-ink-soft" aria-live="polite">
        <template v-if="summary">{{ summary }}</template>
        <template v-else>Searching…</template>
      </h2>

      <div v-if="error" class="space-y-3">
        <ErrorAlert :message="getErrorMessage(error)" title="Search failed" />
        <button type="button" class="btn-quiet -ml-3" @click="refresh()">Try again</button>
      </div>

      <template v-else>
        <ConsultationTable
          :consultations="data?.items ?? []"
          :loading="status === 'pending'"
          caption="Search results"
        >
          <template #empty>
            <p class="font-display text-[1.75rem] leading-tight">No matches.</p>
            <p class="max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">
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
