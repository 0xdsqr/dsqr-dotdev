import { Page } from '@dsqr-dotdev/react/components/page'
import { pageHead } from '@dsqr-dotdev/react/head'
import { createFileRoute } from '@tanstack/react-router'
import { Intro } from '../components/intro'
import { Subscribe } from '../components/subscribe'
import { site } from '../site'

export const Route = createFileRoute('/about')({
  head: () => pageHead({ title: `About | ${site.name}`, path: '/about', origin: site.origin }),
  component: About,
})

function About() {
  return (
    <Page site={site.name} centered footerAction={<Subscribe />}>
      <Intro />
    </Page>
  )
}
