import type { H3Event } from 'h3'

// The Nuxt server stands between the browser and FastAPI (a backend-for-frontend). It keeps
// the access token in an HttpOnly cookie, so page scripts never see it, and adds it as the
// Bearer header on every call it forwards to the API.

export const TOKEN_COOKIE = 'cc_token'

/** Sets the token cookie: HttpOnly, sent only to this site, and `Secure` when configured. */
export function setTokenCookie(event: H3Event, token: string): void {
  setCookie(event, TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(useRuntimeConfig(event).cookieSecure),
    path: '/',
  })
}

export function clearTokenCookie(event: H3Event): void {
  deleteCookie(event, TOKEN_COOKIE, { path: '/' })
}

/** Ends the request with `status` and an API-style `{"detail": ...}` body. */
export function reply(event: H3Event, status: number, detail: string) {
  setResponseStatus(event, status)
  return { detail }
}

/**
 * True unless a browser sent the request from another site. Browsers add `Origin` to every
 * cross-site POST, and SameSite=Lax already keeps the cookie off those, so this is a second
 * guard against CSRF. Requests without `Origin` come from SSR or non-browser clients.
 */
export function isSameOrigin(event: H3Event): boolean {
  const origin = getRequestHeader(event, 'origin')
  if (!origin) return true
  try {
    return new URL(origin).host === getRequestHost(event)
  } catch {
    return false
  }
}

interface BackendCall {
  method?: 'GET' | 'POST'
  query?: Record<string, unknown>
  body?: unknown
  /** Defaults to the token from the request's cookie. */
  token?: string
}

export interface BackendReply<T = unknown> {
  status: number
  data: T
}

/** Calls FastAPI and returns its status and body as they are, errors included. */
export async function callBackend<T = unknown>(
  event: H3Event,
  path: string,
  { method = 'GET', query, body, token = getCookie(event, TOKEN_COOKIE) }: BackendCall = {},
): Promise<BackendReply<T>> {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  const contentType = getRequestHeader(event, 'content-type')
  if (body !== undefined && contentType) headers['content-type'] = contentType

  try {
    const response = await $fetch.raw<T>(path, {
      baseURL: useRuntimeConfig(event).apiBase,
      method,
      query,
      body: body as BodyInit | Record<string, unknown> | undefined,
      headers,
      // Statuses and errors go back to the page unchanged; the page's client retries GETs.
      ignoreResponseError: true,
      retry: 0,
    })
    return { status: response.status, data: response._data as T }
  } catch {
    return { status: 502, data: { detail: 'The API is unreachable.' } as T }
  }
}

/** Sends a backend reply on to the browser. */
export function relay<T>(event: H3Event, { status, data }: BackendReply<T>): T | null {
  setResponseStatus(event, status)
  return data ?? null
}
