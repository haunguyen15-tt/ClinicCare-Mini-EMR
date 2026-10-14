import { describe, expect, it } from 'vitest'
import { ageFrom, formatDate, plural } from '~/utils/format'

describe('formatDate', () => {
  it('formats a calendar date the same way in every time zone', () => {
    expect(formatDate('1980-03-07')).toBe('07 Mar 1980')
  })
})

describe('ageFrom', () => {
  const today = new Date(2026, 9, 14) // 14 Oct 2026, local time

  it('counts the birthday on the day itself', () => {
    expect(ageFrom('1980-10-14', today)).toBe(46)
  })

  it('does not count a birthday later in the year', () => {
    expect(ageFrom('1980-10-15', today)).toBe(45)
    expect(ageFrom('1980-12-01', today)).toBe(45)
  })

  it('counts a birthday earlier in the year', () => {
    expect(ageFrom('1980-01-31', today)).toBe(46)
  })
})

describe('plural', () => {
  it.each([
    [0, '0 notes'],
    [1, '1 note'],
    [2, '2 notes'],
    [1200, '1,200 notes'],
  ])('%i -> %s', (count, text) => {
    expect(plural(count, 'note')).toBe(text)
  })
})
