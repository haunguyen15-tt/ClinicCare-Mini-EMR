import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { getHeader, readBody, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Doctor, LoginRequest } from '~/types/api'

// The real api plugin runs here (base URL, Bearer header, 401 handling); only the backend
// is replaced, by endpoints registered on the test environment's in-process server.

const DOCTOR: Doctor = { id: 1, username: 'doctor', full_name: 'Dr. Jane Smith' }
const TOKEN = 'token-for-doctor'

const url = (path: string) => `${useRuntimeConfig().public.apiBase}${path}`

interface Seen {
  method: string
  authorization: string | undefined
  body?: unknown
}

let seen: Record<string, Seen[]>
let unregister: (() => void)[]

function endpoint(path: string, method: 'GET' | 'POST', handler: (event: H3Event) => unknown) {
  unregister.push(
    registerEndpoint(url(path), {
      method,
      handler: async (event: H3Event) => {
        const body = method === 'POST' ? await readBody(event) : undefined
        ;(seen[path] ??= []).push({ method, authorization: getHeader(event, 'authorization'), body })
        return handler(event)
      },
    }),
  )
}

// An error the way FastAPI sends it: the status plus `{"detail": ...}`.
function fail(event: H3Event, status: number, detail: string) {
  setResponseStatus(event, status)
  return { detail }
}

// The backend's login and /auth/me, accepting doctor / doctor123.
function fakeBackend() {
  endpoint('/auth/login', 'POST', async (event) => {
    const { username, password } = await readBody<LoginRequest>(event)
    if (username !== 'doctor' || password !== 'doctor123') {
      return fail(event, 401, 'Incorrect username or password')
    }
    return { access_token: TOKEN, token_type: 'bearer' }
  })
  endpoint('/auth/me', 'GET', (event) => {
    if (getHeader(event, 'authorization') !== `Bearer ${TOKEN}`) {
      return fail(event, 401, 'Could not validate credentials')
    }
    return DOCTOR
  })
}

const cookieToken = () => document.cookie.match(/(?:^|; )cc_token=([^;]*)/)?.[1]

beforeEach(() => {
  seen = {}
  unregister = []
  useAuth().clearSession()
  fakeBackend()
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

  it('logs in, keeps the token and loads the doctor with it', async () => {
    const { login, isAuthenticated, doctor } = useAuth()

    await login({ username: 'doctor', password: 'doctor123' })

    expect(seen['/auth/login']).toEqual([
      { method: 'POST', authorization: undefined, body: { username: 'doctor', password: 'doctor123' } },
    ])
    expect(seen['/auth/me']).toEqual([{ method: 'GET', authorization: `Bearer ${TOKEN}` }])
    expect(isAuthenticated.value).toBe(true)
    expect(useAuthToken().value).toBe(TOKEN)
    expect(doctor.value).toEqual(DOCTOR)
  })

  it('persists the token in the cc_token cookie, so it survives a reload', async () => {
    await useAuth().login({ username: 'doctor', password: 'doctor123' })
    await nextTick()

    expect(cookieToken()).toBe(TOKEN)
    // A fresh cookie ref (as after a reload) reads the same token back.
    expect(useCookie('cc_token').value).toBe(TOKEN)
  })

  it('rejects a wrong password with the API message and stays signed out', async () => {
    const { login, isAuthenticated, doctor } = useAuth()
    const path = useRouter().currentRoute.value.fullPath

    const error = await login({ username: 'doctor', password: 'nope' }).catch((caught: unknown) => caught)

    expect(getErrorMessage(error)).toBe('Incorrect username or password')
    expect(isAuthenticated.value).toBe(false)
    expect(doctor.value).toBeNull()
    expect(seen['/auth/me']).toBeUndefined()
    // A 401 without a token is the form's business: no redirect.
    expect(useRouter().currentRoute.value.fullPath).toBe(path)
  })

  it('drops a stale token before logging in', async () => {
    useAuthToken().value = 'expired-token'

    await useAuth().login({ username: 'doctor', password: 'doctor123' })

    expect(seen['/auth/login']?.[0]?.authorization).toBeUndefined()
    expect(useAuthToken().value).toBe(TOKEN)
  })

  it('fetchMe() loads the doctor for a token that survived a reload', async () => {
    useAuthToken().value = TOKEN
    const { fetchMe, doctor } = useAuth()

    await expect(fetchMe()).resolves.toEqual(DOCTOR)
    expect(doctor.value).toEqual(DOCTOR)
  })

  it('logs out: clears the token, the cookie and the doctor, then goes to /login', async () => {
    const { login, logout, isAuthenticated, doctor } = useAuth()
    await login({ username: 'doctor', password: 'doctor123' })

    await logout()
    await nextTick()

    expect(isAuthenticated.value).toBe(false)
    expect(doctor.value).toBeNull()
    expect(cookieToken()).toBeUndefined()
    expect(useRouter().currentRoute.value.path).toBe('/login')
  })

  it('an expired token (401) ends the session and sends the doctor to log in again', async () => {
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
