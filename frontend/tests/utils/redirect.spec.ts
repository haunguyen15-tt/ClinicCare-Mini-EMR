import { describe, expect, it } from 'vitest'
import { loginRoute, safeRedirect } from '~/utils/redirect'

describe('safeRedirect', () => {
  it.each(['/', '/consultations', '/search?patient=Ann%20Lee&page=2'])('keeps the same-site path %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each([
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash host', '/\\evil.example'],
    ['a relative path', 'consultations'],
    ['an empty string', ''],
    ['a repeated query value', ['/a', '/b']],
    ['a missing value', undefined],
  ])('falls back to / for %s', (_case, value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})

describe('loginRoute', () => {
  it('sends the current path along as ?redirect=', () => {
    expect(loginRoute('/search?diagnosis=E11')).toEqual({ path: '/login', query: { redirect: '/search?diagnosis=E11' } })
  })
})
