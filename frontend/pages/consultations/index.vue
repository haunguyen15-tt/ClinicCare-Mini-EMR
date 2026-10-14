<script setup lang="ts">
import type { ConsultationList } from '~/types/api'

useHead({ title: 'Consultations · ClinicCare' })

const api = useApi()
const route = useRoute()
const page = computed(() => pageFromQuery(route.query.page))

// Lazy: changing pages swaps the list in place (old rows dimmed) instead of blocking navigation.
const { data, status, error, refresh } = useAsyncData(
  'consultations',
  () => api<ConsultationList>('/consultation', {
    query: { skip: (page.value - 1) * PAGE_SIZE, limit: PAGE_SIZE },
  }),
  { lazy: true, watch: [page] },
)

// Set by the new consultation form after saving.
const notice = ref(useFlash().take())

const consultations = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
</script>

<template>
  <div class="space-y-8 sm:space-y-10">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="eyebrow reveal">Records · {{ tabNumber(0) }}</p>
        <h1 class="page-title reveal mt-3 [--d:80ms]">Consultations</h1>
        <p class="reveal mt-3 text-[0.9375rem] text-ink-soft [--d:160ms]">
          <template v-if="data">{{ plural(total, 'note') }} on file, newest first.</template>
          <template v-else>Notes on file, newest first.</template>
        </p>
      </div>
      <NuxtLink to="/consultations/new" class="btn-primary reveal w-full shrink-0 [--d:200ms] sm:w-auto">
        <span aria-hidden="true" class="font-mono">+</span> New consultation
      </NuxtLink>
    </header>

    <div
      v-if="notice"
      role="status"
      class="reveal flex items-center gap-3 border-l-2 border-accent bg-accent-soft/70 py-2 pl-4 pr-1 text-[0.9375rem] text-ink"
    >
      <svg class="size-4 shrink-0 text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4 10.5 4 4 8-9" />
      </svg>
      <p class="min-w-0 flex-1 break-words">{{ notice.message }}</p>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-sm text-ink-soft hover:bg-accent/10 hover:text-ink"
        @click="notice = null"
      >
        <span class="sr-only">Dismiss</span>
        <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" d="M5 5l10 10M15 5 5 15" />
        </svg>
      </button>
    </div>

    <div v-if="error" class="space-y-3">
      <ErrorAlert :message="getErrorMessage(error)" title="Could not load consultations" />
      <button type="button" class="btn-quiet -ml-3" @click="refresh()">Try again</button>
    </div>

    <div v-else class="reveal space-y-5 [--d:240ms]">
      <ConsultationTable
        :consultations="consultations"
        :loading="status === 'pending'"
        :highlight-id="notice?.consultationId"
      >
        <template #empty>
          <template v-if="page > 1">
            <p class="font-display text-[1.75rem] leading-tight">No notes on this page.</p>
            <NuxtLink to="/consultations" class="btn-quiet -ml-3 mt-2">← Back to the newest notes</NuxtLink>
          </template>
          <template v-else>
            <p class="font-display text-[1.75rem] leading-tight">Nothing on file yet.</p>
            <p class="max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">
              Notes you write appear here, newest first.
            </p>
            <NuxtLink to="/consultations/new" class="btn-primary mt-5">Write the first consultation</NuxtLink>
          </template>
        </template>
      </ConsultationTable>

      <PaginationBar :page="page" :page-size="PAGE_SIZE" :total="total" />
    </div>
  </div>
</template>
