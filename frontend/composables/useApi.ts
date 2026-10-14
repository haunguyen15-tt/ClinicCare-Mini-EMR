/**
 * The backend client: `useApi()<ConsultationList>('/consultation', { query })`.
 * Adds the base URL and Bearer token; see plugins/api.ts.
 */
export function useApi() {
  return useNuxtApp().$api
}
