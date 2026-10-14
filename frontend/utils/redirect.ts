/**
 * A same-site path taken from a `?redirect=` query, or `fallback`.
 * Rejects absolute URLs and protocol-relative ones (`//host`, `/\host`) so the login
 * page cannot be used as an open redirect.
 */
export function safeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || /^\/[\\/]/.test(value)) return fallback
  return value
}
