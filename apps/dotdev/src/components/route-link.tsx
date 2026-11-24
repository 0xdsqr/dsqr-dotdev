import { TextLink } from '@dsqr-dotdev/react/components/text-link'
import { createLink } from '@tanstack/react-router'

/** The shared `TextLink` look with client-side navigation and preloading. */
export const RouteTextLink = createLink(TextLink)
