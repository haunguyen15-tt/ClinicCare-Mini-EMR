// One $fetch instance for the backend: base URL, Bearer token and 401 handling.
// It lives in a plugin so the 401 redirect can run inside the Nuxt app context.
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const token = useAuthToken()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (token.value) options.headers.set('Authorization', `Bearer ${token.value}`)
    },
    async onResponseError({ response, options }) {
      // A 401 on a request that carried a token means the session expired: drop it and go to login.
      // A 401 without a token (e.g. wrong password on the login form) is left to the caller.
      if (response.status !== 401 || !options.headers.has('Authorization')) return

      token.value = null
      await nuxtApp.runWithContext(() => {
        const route = useRoute()
        if (route.path === '/login') return
        return navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      })
    },
  })

  return { provide: { api } }
})
