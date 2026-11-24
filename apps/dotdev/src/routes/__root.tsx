import { AppShell } from '@dsqr-dotdev/react/components/app-shell'
import { ErrorPage, NotFoundPage } from '@dsqr-dotdev/react/components/status-page'
import { siteHead } from '@dsqr-dotdev/react/head'
import { createRootRoute } from '@tanstack/react-router'
import ogImage from '../assets/og.png?url'
import { site } from '../site'

export const Route = createRootRoute({
  head: () => {
    const head = siteHead({ title: site.name, description: site.description, origin: site.origin, image: ogImage })
    return { ...head, links: [...head.links, { rel: 'manifest', href: '/manifest.webmanifest' }] }
  },
  shellComponent: AppShell,
  notFoundComponent: () => <NotFoundPage site={site.name} />,
  errorComponent: () => <ErrorPage site={site.name} />,
})
