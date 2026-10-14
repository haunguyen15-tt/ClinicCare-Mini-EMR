declare module '#app' {
  interface PageMeta {
    /** Page for signed-out users only (the login page). Every other page requires a session. */
    guest?: boolean
  }
}

export {}
