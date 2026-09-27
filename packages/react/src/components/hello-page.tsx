import { Heading } from './heading'
import { Page } from './page'
import { Text } from './text'

export function HelloPage({ title, message }: { title: string; message: string }) {
  return (
    <Page>
      <div>
        <Heading>{title}</Heading>
        <Text role="status">{message}</Text>
      </div>
    </Page>
  )
}
