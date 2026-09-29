import { Heading } from './heading'
import { Page } from './page'
import { Section } from './section'
import { Text } from './text'

export function HelloPage({ site, title, message }: { site: string; title: string; message: string }) {
  return (
    <Page site={site}>
      <Section>
        <Heading>{title}</Heading>
        <Text role="status" tone="muted">{message}</Text>
      </Section>
    </Page>
  )
}
