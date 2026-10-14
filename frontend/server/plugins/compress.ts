import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

// Compresses server-rendered HTML (Nitro's own server sends it raw). The built JS, CSS and
// fonts are compressed at build time instead (`nitro.compressPublicAssets`).
const MIN_BYTES = 1024

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    if (typeof response.body !== 'string' || Buffer.byteLength(response.body) < MIN_BYTES) return

    const accepted = getRequestHeader(event, 'accept-encoding') ?? ''
    const headers = (response.headers ??= {})
    if (/\bbr\b/.test(accepted)) {
      // Quality 5: most of the size win at a small fraction of the CPU time of 11.
      response.body = brotliCompressSync(response.body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
      headers['content-encoding'] = 'br'
    } else if (/\bgzip\b/.test(accepted)) {
      response.body = gzipSync(response.body)
      headers['content-encoding'] = 'gzip'
    } else {
      return
    }
    headers.vary = 'Accept-Encoding'
  })
})
