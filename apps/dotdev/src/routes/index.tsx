import { Footer } from '@dsqr-dotdev/react/components/footer'
import { visuallyHidden } from '@dsqr-dotdev/react/visually-hidden'
import * as stylex from '@stylexjs/stylex'
import { createFileRoute } from '@tanstack/react-router'
import { Intro } from '../components/intro'
import { Subscribe } from '../components/subscribe'
import { Theater } from '../theater/theater'

export const Route = createFileRoute('/')({ component: Home })

const styles = stylex.create({
  encore: {
    colorScheme: 'dark',
    backgroundColor: '#07050d',
    backgroundImage: 'linear-gradient(to bottom, #07050d, #0d0818)',
    paddingBlock: '1.5rem 0',
  },
})

function Home() {
  return (
    <main>
      <div {...stylex.props(visuallyHidden.base)}>
        <Intro />
      </div>
      <Theater />
      <div {...stylex.props(styles.encore)}>
        <Footer site="dsqr.dev" action={<Subscribe />} divider={false} />
      </div>
    </main>
  )
}
