import { Heading } from '@dsqr-dotdev/react/components/heading'
import { Page } from '@dsqr-dotdev/react/components/page'
import { Stack } from '@dsqr-dotdev/react/components/stack'
import { Text } from '@dsqr-dotdev/react/components/text'
import { useId } from 'react'
import { site } from '../site'
import { RouteTextLink } from './route-link'
import { Subscribe } from './subscribe'

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  const heading = useId()
  return (
    <Page site={site.name} centered footerAction={<Subscribe />}>
      <Stack align="center" gap="sm" labelledBy={heading}>
        <Heading id={heading}>{title}</Heading>
        <Text tone="muted">{blurb}</Text>
        <RouteTextLink to="/">Back to the show</RouteTextLink>
      </Stack>
    </Page>
  )
}
