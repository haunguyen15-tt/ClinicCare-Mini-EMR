/** The access token cookie, shared app-wide; see plugins/api.ts. */
export function useAuthToken() {
  return useNuxtApp().$authToken
}
