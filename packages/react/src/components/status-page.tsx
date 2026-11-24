import { type ReactNode, useId } from 'react'
import { Button } from './button'
import { Heading } from './heading'
import { Page } from './page'
import { Stack } from './stack'
import { Text } from './text'
import { TextLink } from './text-link'

function StatusPage({ site, title, children }: { site: string; title: string; children: ReactNode }) {
  const heading = useId()
  return (
    <Page site={site} centered>
      <Stack align="center" gap="sm" labelledBy={heading}>
        <Heading id={heading}>{title}</Heading>
        {children}
      </Stack>
    </Page>
  )
}

export function NotFoundPage({ site }: { site: string }) {
  return (
    <StatusPage site={site} title="Page not found">
      <Text tone="muted">That page doesn't exist, or it has moved.</Text>
      <TextLink href="/">Go to the home page</TextLink>
    </StatusPage>
  )
}

export function ErrorPage({ site }: { site: string }) {
  return (
    <StatusPage site={site} title="Something went wrong">
      <Text tone="muted">This page failed to load. Reloading usually fixes it.</Text>
      <Button onClick={() => window.location.reload()}>Reload the page</Button>
    </StatusPage>
  )
}
