import type { FetchError } from 'ofetch'
import type { ApiErrorBody, ValidationErrorItem } from '~/types/api'

const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const SERVER_MESSAGE = 'Something went wrong on the server. Please try again.'
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

function isFetchError(error: unknown): error is FetchError<Partial<ApiErrorBody> | undefined> {
  return error instanceof Error && error.name === 'FetchError'
}

function detailOf(error: unknown): ApiErrorBody['detail'] | undefined {
  return isFetchError(error) ? error.data?.detail : undefined
}

// Pydantic prefixes messages from custom validators with "Value error, ".
function cleanMessage(msg: string): string {
  return msg.replace(/^Value error, /, '')
}

// ['body', 'patient_name'] -> 'patient_name'; ['query', 'limit'] -> 'limit'.
function fieldOf(item: ValidationErrorItem): string {
  return String(item.loc[1] ?? item.loc[0] ?? '')
}

function humanize(field: string): string {
  const words = field.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** HTTP status of a failed request, or undefined when no response came back. */
export function getErrorStatus(error: unknown): number | undefined {
  return isFetchError(error) ? error.statusCode : undefined
}

/** A message that can be shown to the user as is. */
export function getErrorMessage(error: unknown): string {
  if (!isFetchError(error)) return FALLBACK_MESSAGE
  if (error.statusCode === undefined) return NETWORK_MESSAGE
  if (error.statusCode >= 500) return SERVER_MESSAGE

  const detail = detailOf(error)
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => `${humanize(fieldOf(item))}: ${cleanMessage(item.msg)}`).join('\n')
  }
  return FALLBACK_MESSAGE
}

/** 422 messages keyed by field name, for showing next to form inputs. First message per field wins. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const detail = detailOf(error)
  const errors: Record<string, string> = {}
  if (!Array.isArray(detail)) return errors
  for (const item of detail) {
    const field = fieldOf(item)
    errors[field] ??= cleanMessage(item.msg)
  }
  return errors
}
