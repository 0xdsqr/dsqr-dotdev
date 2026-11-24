import { RegistryProvider } from '@effect/atom-react'
import { HeadContent, Scripts, useRouter } from '@tanstack/react-router'
import { type ReactNode, useEffect } from 'react'
import { Document } from './document'

/** The root route's shell for every app: document, head tags, the atom registry, and scripts. */
export function AppShell({ children }: { children: ReactNode }) {
  const nonce = useRouter().options.ssr?.nonce
  useEffect(() => {
    if (import.meta.env.DEV) void import('virtual:stylex:runtime')
  }, [])

  return (
    <Document
      nonce={nonce}
      head={
        <>
          <HeadContent />
          {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" />}
        </>
      }
    >
      <RegistryProvider>{children}</RegistryProvider>
      <Scripts />
    </Document>
  )
}
