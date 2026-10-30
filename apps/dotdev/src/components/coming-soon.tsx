import { Heading } from '@dsqr-dotdev/react/components/heading'
import { Page } from '@dsqr-dotdev/react/components/page'
import { Stack } from '@dsqr-dotdev/react/components/stack'
import { Text } from '@dsqr-dotdev/react/components/text'
import { TextLink } from '@dsqr-dotdev/react/components/text-link'
import { useId } from 'react'
import { Subscribe } from './subscribe'

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  const heading = useId()
  return (
    <Page site="dsqr.dev" centered footerAction={<Subscribe />}>
      <Stack align="center" gap="sm" labelledBy={heading}>
        <Heading id={heading}>{title}</Heading>
        <Text tone="muted">{blurb}</Text>
        <TextLink href="/">Back to the show</TextLink>
      </Stack>
    </Page>
  )
}
