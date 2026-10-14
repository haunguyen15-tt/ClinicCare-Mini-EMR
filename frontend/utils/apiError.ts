import type { FetchError } from 'ofetch'
import type { ApiErrorBody, ValidationErrorItem } from '~/types/api'

const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const SERVER_MESSAGE = 'Something went wrong on the server. Please try again.'
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

/** What every failed API call carries in `NuxtError.data`; see `toApiError`. */
export interface ApiErrorData {
  detail?: ApiErrorBody['detail']
  /** No response came back (server down, offline, aborted). */
  network?: true
}

function isFetchError(error: unknown): error is FetchError<Partial<ApiErrorBody> | undefined> {
  return error instanceof Error && error.name === 'FetchError'
}

/**
 * Turns a failed $fetch call into a NuxtError (used by plugins/api.ts for every request).
 * useAsyncData keeps a NuxtError as it is, and it survives the SSR payload, whereas a raw
 * FetchError gets re-wrapped there with its status lost.
 */
export function toApiError(error: unknown): unknown {
  if (!isFetchError(error)) return error
  if (error.statusCode === undefined) return createError({ message: error.message, data: { network: true } })
  return createError({
    statusCode: error.statusCode,
    statusMessage: error.statusMessage,
    data: { detail: error.data?.detail },
  })
}

interface ErrorInfo {
  /** Undefined when no response came back (network error). */
  status: number | undefined
  detail: ApiErrorBody['detail'] | undefined
}

function infoOf(error: unknown): ErrorInfo | undefined {
  if (!isNuxtError<ApiErrorData | undefined>(error)) return undefined
  if (error.data?.network) return { status: undefined, detail: undefined }
  return { status: error.statusCode, detail: error.data?.detail }
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
