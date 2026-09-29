import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import appCss from '@dsqr-dotdev/react/globals.css?url'
import type { ApiContext } from '@dsqr-dotdev/api/client'
import { Document } from '@dsqr-dotdev/react/components/document'

export const Route = createRootRouteWithContext<ApiContext>()({
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
    links: [{ rel: 'stylesheet', href: appCss }],
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
      {children}
      <Scripts />
    </Document>
  )
}
