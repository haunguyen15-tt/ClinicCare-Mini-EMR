// One $fetch instance for the API, through this app's own server routes (server/api): the
// server keeps the access token in an HttpOnly cookie and adds it to every call it forwards,
// so the token never reaches page scripts. The plugin handles 401s inside the Nuxt app context.
export default defineNuxtPlugin((nuxtApp) => {
  // During SSR the call goes straight to the server route, without the browser, so it has to
  // carry the page request's cookie itself.
  const cookie = import.meta.server ? useRequestHeaders(['cookie']).cookie : undefined

  const fetcher = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (cookie) options.headers.set('cookie', cookie)
    },
    async onResponseError({ request, response }) {
      // A 401 means there is no valid session (none yet, or it expired): forget the doctor and
      // go to login. A 401 from the login form itself (wrong password) is left to the form.
      if (response.status !== 401 || request === '/auth/login') return

      // While route middleware runs (e.g. its /auth/me check), navigateTo only returns the
      // location and the middleware does the redirect itself, so this never double-navigates.
      await nuxtApp.runWithContext(() => {
        useAuth().clearSession()
        const route = useRouter().currentRoute.value
        if (!route.meta.guest) return navigateTo(loginRoute(route.fullPath))
      })
    },
  })

  // Every failure comes out as a NuxtError with one shape (see toApiError). Done here rather
  // than by throwing from onResponseError, which would skip ofetch's retry of failed GETs.
  const api = ((request, options) => fetcher(request, options).catch((error: unknown) => {
    throw toApiError(error)
  })) as typeof fetcher

  return { provide: { api } }
})
