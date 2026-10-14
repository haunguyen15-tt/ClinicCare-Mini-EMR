import type { ConsultationList, ConsultationQuery } from '~/types/api'

export type ConsultationFilters = Pick<ConsultationQuery, 'patient' | 'diagnosis'>

/**
 * One page of GET /consultation, following `?page=` in the URL. When `filters` returns null
 * there is nothing to search for: no request is made and `data` stays empty.
 */
export function useConsultationPage(key: string, filters: () => ConsultationFilters | null = () => ({})) {
  const api = useApi()
  const route = useRoute()
  const page = computed(() => pageFromQuery(route.query.page))
  // A string, so a query change that leaves the filters as they were does not refetch.
  const filterKey = computed(() => JSON.stringify(filters()))

  // Lazy: changing pages swaps the list in place (old rows dimmed) instead of blocking navigation.
  const { data, status, error, refresh } = useAsyncData(
    key,
    () => {
      const current = filters()
      if (!current) return Promise.resolve(null)
      return api<ConsultationList>('/consultation', {
        query: { ...current, skip: (page.value - 1) * PAGE_SIZE, limit: PAGE_SIZE },
      })
    },
    { lazy: true, watch: [filterKey, page] },
  )

  return { page, data, error, refresh, pending: computed(() => status.value === 'pending') }
}
