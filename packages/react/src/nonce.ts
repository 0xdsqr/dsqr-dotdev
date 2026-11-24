import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start'

/**
 * The request's CSP nonce for `createRouter({ ssr: { nonce } })`. The server reads it
 * from the Start context; the client reads the `csp-nonce` meta the router renders,
 * so hydrated scripts match.
 */
export const requestNonce = createIsomorphicFn()
  .server(() => (getGlobalStartContext() as { nonce?: string } | undefined)?.nonce)
  .client(() => document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.content || undefined)
