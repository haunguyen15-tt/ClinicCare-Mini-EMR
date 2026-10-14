import type { Doctor, LoginRequest, Token } from '~/types/api'

/** Session state: the token cookie plus the signed-in doctor, shared across the app. */
export function useAuth() {
  // Resolved up front: these need the Nuxt context, which is gone after an `await` on the server.
  const api = useApi()
  const token = useAuthToken()
  const doctor = useState<Doctor | null>('auth:doctor', () => null)

  const isAuthenticated = computed(() => Boolean(token.value))

  async function fetchMe(): Promise<Doctor> {
    doctor.value = await api<Doctor>('/auth/me')
    return doctor.value
  }

  async function login(credentials: LoginRequest): Promise<void> {
    // Drop any stale token first so the login request goes out without one,
    // and a wrong password is not mistaken for an expired session.
    clearSession()
    const { access_token } = await api<Token>('/auth/login', { method: 'POST', body: credentials })
    token.value = access_token
    await fetchMe()
  }

  function clearSession(): void {
    token.value = null
    doctor.value = null
  }

  async function logout(): Promise<void> {
    clearSession()
    await navigateTo('/login')
  }

  return {
    doctor: readonly(doctor),
    isAuthenticated,
    fetchMe,
    login,
    logout,
    clearSession,
  }
}
