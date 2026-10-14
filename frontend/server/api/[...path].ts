// Forwards the page's API calls to FastAPI with the token from the HttpOnly cookie.
// Only the API's own routes go through, matched exactly, so the proxy cannot be pointed
// anywhere else (no `..`, no other paths). Login and logout have their own routes.
const ROUTES: { method: 'GET' | 'POST'; path: RegExp }[] = [
  { method: 'GET', path: /^\/auth\/me$/ },
  { method: 'GET', path: /^\/diagnosis$/ },
  { method: 'GET', path: /^\/consultation(?:\/\d+)?$/ },
  { method: 'POST', path: /^\/consultation$/ },
]

export default defineEventHandler(async (event) => {
  const path = `/${getRouterParam(event, 'path') ?? ''}`
  const method = event.method
  const route = ROUTES.find((candidate) => candidate.method === method && candidate.path.test(path))
  if (!route) return reply(event, 404, 'Not Found')
  if (!isSameOrigin(event)) return reply(event, 403, 'Cross-site request refused.')
  // No cookie, no session: answer like the API would, without calling it.
  if (!getCookie(event, TOKEN_COOKIE)) return reply(event, 401, 'Not authenticated')

  const response = await callBackend(event, path, {
    method: route.method,
    query: getQuery(event),
    body: route.method === 'POST' ? await readRawBody(event) : undefined,
  })
  // The token in the cookie is no longer accepted (expired, or signed with an old secret).
  if (response.status === 401) clearTokenCookie(event)
  return relay(event, response)
})
