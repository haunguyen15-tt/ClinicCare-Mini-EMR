// Calendar dates (`YYYY-MM-DD`) have no time zone, so they are formatted in UTC: the
// server and the browser then render the same text. Timestamps use <NuxtTime> instead,
// which shows them in the browser's time zone without a hydration mismatch.
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** '1980-03-07' -> '07 Mar 1980'. */
export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate))
}

/** Age in whole years on `today` for a `YYYY-MM-DD` date of birth. */
export function ageFrom(isoDate: string, today: Date = new Date()): number {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number]
  const birthdayPassed = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  return today.getFullYear() - year - (birthdayPassed ? 0 : 1)
}

/** (1, 'note') -> '1 note'; (1200, 'note') -> '1,200 notes'. */
export function plural(count: number, noun: string): string {
  return `${count.toLocaleString('en-GB')} ${noun}${count === 1 ? '' : 's'}`
}
