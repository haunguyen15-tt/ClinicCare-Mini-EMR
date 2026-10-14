import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { readBody, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Doctor, LoginRequest } from '~/types/api'

// The real api plugin runs here (/api base URL, 401 handling); only the app's server routes
// (server/api) are replaced, by endpoints registered on the test environment's server.
// The server routes themselves run against the real backend in the e2e suite.

const DOCTOR: Doctor = { id: 1, username: 'doctor', full_name: 'Dr. Jane Smith' }
interface Seen {
  method: string
  body?: unknown
}

let seen: Record<string, Seen[]>
// What the fake server's session cookie would say: set by login, dropped by logout.
let signedIn: boolean
let unregister: (() => void)[]

function endpoint(path: string, method: 'GET' | 'POST', handler: (event: H3Event) => unknown) {
  unregister.push(
    registerEndpoint(`/api${path}`, {
      method,
      handler: async (event: H3Event) => {
        const body = method === 'POST' ? await readBody(event) : undefined
        ;(seen[path] ??= []).push(body === undefined ? { method } : { method, body })
        return handler(event)
      },
    }),
  )
}

// An error the way the server routes send it: the status plus `{"detail": ...}`.
function fail(event: H3Event, status: number, detail: string) {
  setResponseStatus(event, status)
  return { detail }
}

// The BFF routes, accepting doctor / doctor123.
function fakeServer() {
  endpoint('/auth/login', 'POST', async (event) => {
    const { username, password } = await readBody<LoginRequest>(event)
    if (username !== 'doctor' || password !== 'doctor123') {
      return fail(event, 401, 'Incorrect username or password')
    }
    signedIn = true
    return DOCTOR
  })
  endpoint('/auth/me', 'GET', (event) => {
    return signedIn ? DOCTOR : fail(event, 401, 'Not authenticated')
  })
  endpoint('/auth/logout', 'POST', (event) => {
    signedIn = false
    setResponseStatus(event, 204)
    return null
  })
}

beforeEach(() => {
  seen = {}
  signedIn = false
  unregister = []
  useAuth().clearSession()
  fakeServer()
})

afterEach(() => {
  unregister.forEach((remove) => remove())
})

describe('useAuth', () => {
  it('starts signed out', () => {
    const { isAuthenticated, doctor } = useAuth()
    expect(isAuthenticated.value).toBe(false)
    expect(doctor.value).toBeNull()
  })

  it('logs in through the server route and keeps the doctor it returns', async () => {
    const { login, isAuthenticated, doctor } = useAuth()

    await login({ username: 'doctor', password: 'doctor123' })

    expect(seen['/auth/login']).toEqual([{ method: 'POST', body: { username: 'doctor', password: 'doctor123' } }])
    // The server answers with the doctor, so no second round trip.
    expect(seen['/auth/me']).toBeUndefined()
    expect(isAuthenticated.value).toBe(true)
    expect(doctor.value).toEqual(DOCTOR)
  })

  it('rejects a wrong password with the API message and stays signed out', async () => {
    const { login, isAuthenticated, doctor } = useAuth()
    const path = useRouter().currentRoute.value.fullPath

    const error = await login({ username: 'doctor', password: 'nope' }).catch((caught: unknown) => caught)

    expect(getErrorMessage(error)).toBe('Incorrect username or password')
    expect(isAuthenticated.value).toBe(false)
    expect(doctor.value).toBeNull()
    // A 401 from the login form is the form's business: no redirect.
    expect(useRouter().currentRoute.value.fullPath).toBe(path)
  })

  it('ensureSession() looks the session up once and keeps the answer', async () => {
    useState('auth:checked').value = false
    const { ensureSession, doctor } = useAuth()

    await ensureSession()
    await ensureSession()

    expect(seen['/auth/me']).toEqual([{ method: 'GET' }])
    expect(doctor.value).toBeNull()
  })

  it('ensureSession() loads the doctor when the server knows the session', async () => {
    useState('auth:checked').value = false
    signedIn = true
    const { ensureSession, isAuthenticated, doctor } = useAuth()

    await ensureSession()

    expect(isAuthenticated.value).toBe(true)
    expect(doctor.value).toEqual(DOCTOR)
  })

  it('logs out: asks the server to drop the cookie, forgets the doctor, then goes to /login', async () => {
    const { login, logout, isAuthenticated, doctor } = useAuth()
    await login({ username: 'doctor', password: 'doctor123' })

    await logout()

    expect(seen['/auth/logout']).toEqual([{ method: 'POST' }])
    expect(isAuthenticated.value).toBe(false)
    expect(doctor.value).toBeNull()
    expect(useRouter().currentRoute.value.path).toBe('/login')
  })

  it('an expired session (401) signs the doctor out and sends them to log in again', async () => {
    await useAuth().login({ username: 'doctor', password: 'doctor123' })
    await navigateTo('/search?patient=Ann')
    endpoint('/diagnosis', 'GET', (event) => fail(event, 401, 'Could not validate credentials'))

    await expect(useApi()('/diagnosis')).rejects.toMatchObject({ statusCode: 401 })
    await flushPromises()

    expect(useAuth().isAuthenticated.value).toBe(false)
    const route = useRouter().currentRoute.value
    expect(route.path).toBe('/login')
    expect(route.query.redirect).toBe('/search?patient=Ann')
  })
})
