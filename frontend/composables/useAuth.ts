import type { Doctor, LoginRequest } from '~/types/api'

/**
 * Session state: the signed-in doctor, shared across the app. The token lives in an HttpOnly
 * cookie that only the Nuxt server reads (server/api), so the doctor is how pages know.
 */
export function useAuth() {
  // Resolved up front: these need the Nuxt context, which is gone after an `await` on the server.
  const api = useApi()
  const doctor = useState<Doctor | null>('auth:doctor', () => null)
  // Whether the session has been looked up yet (once per visit, on the server when possible).
  const checked = useState('auth:checked', () => false)

  const isAuthenticated = computed(() => doctor.value !== null)

  async function fetchMe(): Promise<Doctor> {
    doctor.value = await api<Doctor>('/auth/me')
    checked.value = true
    return doctor.value
  }

  /** Looks the session up once. Any failure (no session, API down) counts as signed out. */
  async function ensureSession(): Promise<void> {
    if (checked.value) return
    await fetchMe().catch(() => {})
    checked.value = true
  }

  async function login(credentials: LoginRequest): Promise<void> {
    doctor.value = await api<Doctor>('/auth/login', { method: 'POST', body: credentials })
    checked.value = true
  }

  function clearSession(): void {
    doctor.value = null
    checked.value = true
  }

  async function logout(): Promise<void> {
    // The cookie is HttpOnly, so only the server can remove it. Sign out locally either way.
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
    await navigateTo('/login')
  }

  return {
    doctor: readonly(doctor),
    isAuthenticated,
    fetchMe,
    ensureSession,
    login,
    logout,
    clearSession,
  }
}
