/**
 * The access token, kept in a cookie so it is available during SSR and survives a refresh.
 * Expiry is enforced by the API: an expired token gets a 401 and plugins/api.ts clears it.
 */
export function useAuthToken() {
  return useCookie<string | null>('cc_token', { default: () => null, sameSite: 'lax' })
}
