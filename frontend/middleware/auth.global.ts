// Every page needs a session except those marked `definePageMeta({ guest: true })`.
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.guest) {
    // Already signed in: skip the login page.
    if (isAuthenticated.value) return navigateTo(safeRedirect(to.query.redirect))
    return
  }

  if (!isAuthenticated.value) return navigateTo(loginRoute(to.fullPath))
})
