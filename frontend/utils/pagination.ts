/** Consultations per page on the list and search pages. */
export const PAGE_SIZE = 20

/** The `?page=` query value as a page number, falling back to 1 when missing or invalid. */
export function pageFromQuery(value: unknown): number {
  const page = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}
