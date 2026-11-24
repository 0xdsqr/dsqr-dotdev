import { AppShell } from '@dsqr-dotdev/react/components/app-shell'
import { ErrorPage, NotFoundPage } from '@dsqr-dotdev/react/components/status-page'
import { siteHead } from '@dsqr-dotdev/react/head'
import { createRootRoute } from '@tanstack/react-router'

const site = 'DSQR Labs LLC'

export const Route = createRootRoute({
  head: () =>
    siteHead({
      title: site,
      description: 'A one-person consulting studio for systems, infrastructure, performance, and backend engineering.',
    }),
  shellComponent: AppShell,
  notFoundComponent: () => <NotFoundPage site={site} />,
  errorComponent: () => <ErrorPage site={site} />,
})
