import { Footer } from '@dsqr-dotdev/react/components/footer'
import { pageHead } from '@dsqr-dotdev/react/head'
import * as stylex from '@stylexjs/stylex'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { Intro } from '../components/intro'
import { Subscribe } from '../components/subscribe'
import type { Destination } from '../content/destinations'
import { site } from '../site'
import { backdrops, chrome } from '../theater/chrome.stylex'
import { Theater } from '../theater/theater'

export const Route = createFileRoute('/')({
  head: () => {
    const head = pageHead({ title: site.name, path: '/', origin: site.origin })
    // The stage is always night, so the browser chrome matches it in either theme.
    return { ...head, meta: [...head.meta, { name: 'theme-color', content: '#07050d' }] }
  },
  component: Home,
})

const styles = stylex.create({
  encore: {
    colorScheme: 'dark',
    backgroundColor: chrome.night,
    backgroundImage: backdrops.encore,
    paddingBlock: '1.5rem 0',
  },
})

function Home() {
  const navigate = useNavigate()
  const onNavigate = useCallback((destination: Destination) => void navigate({ to: destination.href }), [navigate])
  return (
    <>
      <main>
        <Theater intro={<Intro />} onNavigate={onNavigate} />
      </main>
      <div {...stylex.props(styles.encore)}>
        <Footer site={site.name} action={<Subscribe />} divider={false} />
      </div>
    </>
  )
}
