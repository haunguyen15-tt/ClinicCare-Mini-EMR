// Every page needs a session except those marked `definePageMeta({ guest: true })`.
export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, ensureSession } = useAuth()

  // Page scripts cannot read the HttpOnly token cookie, so the first navigation asks the
  // server who is signed in (during SSR when possible; the answer travels in the payload).
  await ensureSession()

  if (to.meta.guest) {
    // Already signed in: skip the login page.
    if (isAuthenticated.value) return navigateTo(safeRedirect(to.query.redirect))
    return
  }

  if (!isAuthenticated.value) return navigateTo(loginRoute(to.fullPath))
})
