// Every page needs a session except those marked `definePageMeta({ guest: true })`.
export default defineNuxtRouteMiddleware(async (to) => {
  const { doctor, isAuthenticated, fetchMe } = useAuth()

  if (to.meta.guest) {
    // Already signed in: skip the login page.
    if (isAuthenticated.value) return navigateTo(safeRedirect(to.query.redirect))
    return
  }

  // After a refresh only the token survives. Loading the doctor (once, on the server when
  // possible) also checks the token: a 401 clears the session through the api plugin.
  // Any other failure just leaves the doctor unknown.
  if (isAuthenticated.value && !doctor.value) await fetchMe().catch(() => {})

  if (!isAuthenticated.value) return navigateTo(loginRoute(to.fullPath))
})
