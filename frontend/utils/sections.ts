/** The app's main sections, in order: shared by the nav and the home page's action cards. */
export const sections = [
  { to: '/consultations', label: 'Consultations', description: 'Read past notes, newest first.' },
  { to: '/consultations/new', label: 'New consultation', description: 'Write up a visit with its diagnosis codes.' },
  { to: '/search', label: 'Search', description: 'Find visits by patient name or diagnosis code.' },
] as const

/** Index-tab number for a position in a list: 0 -> "01". */
export function tabNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}
