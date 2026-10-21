import { RegistryProvider } from '@effect/atom-react'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import appCss from '@dsqr-dotdev/react/globals.css?url'
import markUrl from '@dsqr-dotdev/react/mark.svg?url'
import { Document } from '@dsqr-dotdev/react/components/document'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DSQR Labs LLC' },
      {
        name: 'description',
        content: 'A one-person consulting studio for systems, infrastructure, performance, and backend engineering.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: markUrl },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('virtual:stylex:runtime')
    }
  }, [])

  return (
    <Document
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
