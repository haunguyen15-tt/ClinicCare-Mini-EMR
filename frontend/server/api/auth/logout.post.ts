// Ends the session by dropping the token cookie. The JWT itself stays valid until it
// expires, since the API keeps no session list (see the README's future work).
export default defineEventHandler((event) => {
  if (!isSameOrigin(event)) return reply(event, 403, 'Cross-site request refused.')

  clearTokenCookie(event)
  setResponseStatus(event, 204)
  return null
})
