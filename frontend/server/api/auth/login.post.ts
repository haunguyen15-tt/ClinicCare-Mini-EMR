import type { Doctor, LoginRequest, Token } from '~/types/api'

// Signs in through FastAPI, keeps the token in the HttpOnly cookie and returns the doctor.
// The token itself never goes back to the page.
export default defineEventHandler(async (event) => {
  if (!isSameOrigin(event)) return reply(event, 403, 'Cross-site request refused.')

  const credentials = await readBody<LoginRequest>(event)
  // No token on purpose: a stale cookie must not ride along with a fresh login.
  const login = await callBackend<Token>(event, '/auth/login', { method: 'POST', body: credentials, token: '' })
  if (login.status !== 200) return relay(event, login)

  const token = login.data.access_token
  setTokenCookie(event, token)
  return relay(event, await callBackend<Doctor>(event, '/auth/me', { token }))
})
