// One $fetch instance for the backend: base URL, Bearer token and 401 handling.
// It lives in a plugin so the 401 redirect can run inside the Nuxt app context.
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // The access token, kept in a cookie so it is available during SSR and survives a refresh.
  // Created once per app and shared through useAuthToken(): separate useCookie refs with the
  // same name only sync asynchronously, so a freshly set token could miss the next request.
  // Expiry is enforced by the API: an expired token gets a 401 and is cleared below.
  const token = useCookie<string | null>('cc_token', { default: () => null, sameSite: 'lax' })

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (token.value) options.headers.set('Authorization', `Bearer ${token.value}`)
    },
    async onResponseError({ response, options }) {
      // A 401 on a request that carried a token means the session expired: drop it and go to login.
      // A 401 without a token (e.g. wrong password on the login form) is left to the caller.
      if (response.status !== 401 || !options.headers.has('Authorization')) return

      await nuxtApp.runWithContext(() => {
        useAuth().clearSession()
        const route = useRoute()
        if (!route.meta.guest) return navigateTo(loginRoute(route.fullPath))
      })
    },
  })

  return { provide: { api, authToken: token } }
})
