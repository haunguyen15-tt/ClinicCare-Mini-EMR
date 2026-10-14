import type { FetchError } from 'ofetch'
import type { ApiErrorBody, ValidationErrorItem } from '~/types/api'

const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const SERVER_MESSAGE = 'Something went wrong on the server. Please try again.'
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

function isFetchError(error: unknown): error is FetchError<Partial<ApiErrorBody> | undefined> {
  return error instanceof Error && error.name === 'FetchError'
}

interface ErrorInfo {
  /** Undefined when no response came back (network error). */
  status: number | undefined
  detail: ApiErrorBody['detail'] | undefined
}

// A failed $fetch call, thrown directly or wrapped in a NuxtError by useAsyncData. The wrapper
// keeps the response status and body but drops the FetchError, and its status defaults to 500.
// Every backend error has a JSON body, so a wrapper without one means no response came back.
function infoOf(error: unknown): ErrorInfo | undefined {
  if (isFetchError(error)) return { status: error.statusCode, detail: error.data?.detail }
  if (!isNuxtError<Partial<ApiErrorBody> | undefined>(error)) return undefined
  if (error.data === undefined) return { status: undefined, detail: undefined }
  return { status: error.statusCode, detail: error.data.detail }
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
  return infoOf(error)?.status
}

/** A message that can be shown to the user as is. */
export function getErrorMessage(error: unknown): string {
  const info = infoOf(error)
  if (!info) return FALLBACK_MESSAGE
  if (info.status === undefined) return NETWORK_MESSAGE
  if (info.status >= 500) return SERVER_MESSAGE

  const { detail } = info
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => `${humanize(fieldOf(item))}: ${cleanMessage(item.msg)}`).join('\n')
  }
  return FALLBACK_MESSAGE
}

/** 422 messages keyed by field name, for showing next to form inputs. First message per field wins. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const detail = infoOf(error)?.detail
  const errors: Record<string, string> = {}
  if (!Array.isArray(detail)) return errors
  for (const item of detail) {
    const field = fieldOf(item)
    errors[field] ??= cleanMessage(item.msg)
  }
  return errors
}
