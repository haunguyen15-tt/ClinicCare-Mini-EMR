export interface Flash {
  message: string
  /** The consultation the message is about, highlighted in the list. */
  consultationId?: number
}

/** A one-off message carried to the next page, e.g. "saved" after creating a consultation. */
export function useFlash() {
  const flash = useState<Flash | null>('flash', () => null)

  /** Reads the message and clears it, so it shows only once. */
  function take(): Flash | null {
    const value = flash.value
    flash.value = null
    return value
  }

  return { flash, take }
}
