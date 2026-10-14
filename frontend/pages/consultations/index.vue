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

    <div v-if="error" class="space-y-3">
      <ErrorAlert :message="getErrorMessage(error)" title="Could not load consultations" />
      <button type="button" class="btn-quiet -ml-3" @click="refresh()">Try again</button>
    </div>

    <div v-else class="reveal space-y-5 [--d:240ms]">
      <ConsultationTable :consultations="consultations" :loading="status === 'pending'">
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
