import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import appCss from '@dsqr-dotdev/react/globals.css?url'
import type { ApiContext } from '@dsqr-dotdev/api/client'

export const Route = createRootRouteWithContext<ApiContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Studio · dsqr.dev' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: Document,
})

function Document({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('virtual:stylex:runtime')
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
        {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" />}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
