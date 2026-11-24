import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { contentSecurityPolicy, createNonce, staticSecurityHeaders } from './security'

function withHeaders(response: Response, headers: Record<string, string>) {
  // Some responses (e.g. proxied fetches) have immutable headers; copy those first.
  const target = Object.isFrozen(response.headers) ? new Response(response.body, response) : response
  try {
    for (const [name, value] of Object.entries(headers)) target.headers.set(name, value)
    return target
  } catch {
    const copy = new Response(response.body, response)
    for (const [name, value] of Object.entries(headers)) copy.headers.set(name, value)
    return copy
  }
}

/**
 * Every app's Start server entry: mints a CSP nonce per request, hands it to the router
 * (which stamps it on each script it renders), and sends the matching policy.
 * Development skips the CSP because Vite injects its own inline scripts.
 */
export default createServerEntry({
  async fetch(request, options) {
    if (import.meta.env.DEV) return handler.fetch(request, options)
    const nonce = createNonce()
    const response = await handler.fetch(request, { ...options, context: { ...options?.context, nonce } })
    const html = response.headers.get('content-type')?.startsWith('text/html') ?? false
    return withHeaders(response, {
      ...staticSecurityHeaders,
      ...(html ? { 'content-security-policy': contentSecurityPolicy(nonce) } : {}),
    })
  },
})
