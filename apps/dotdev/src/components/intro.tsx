import { Mark } from '@dsqr-dotdev/react/components/mark'
import { Prose } from '@dsqr-dotdev/react/components/prose'
import { Stack } from '@dsqr-dotdev/react/components/stack'
import { visuallyHidden } from '@dsqr-dotdev/react/visually-hidden'
import * as stylex from '@stylexjs/stylex'
import portraitAvif from '../assets/portrait.avif'
import portraitWebp from '../assets/portrait.webp'

const styles = stylex.create({
  portrait: {
    display: 'block',
    width: 'clamp(7.5rem, 6.5rem + 3.75vw, 9rem)',
    height: 'auto',
  },
})

export function Intro() {
  return (
    <Stack align="center" gap="sm" labelledBy="intro-title">
      <h1 id="intro-title" {...stylex.props(visuallyHidden.base)}>
        0xdsqr
      </h1>
      <picture>
        <source srcSet={portraitAvif} type="image/avif" />
        <img
          src={portraitWebp}
          alt="Portrait of 0xdsqr"
          width={480}
          height={601}
          fetchPriority="high"
          decoding="async"
          {...stylex.props(styles.portrait)}
        />
      </picture>
      <Prose>
        Dad of one. I&apos;m primarily interested in <Mark tone="accent">infrastructure</Mark>,{' '}
        <Mark tone="teal">systems</Mark>, <Mark tone="orange">platforms</Mark>,{' '}
        <Mark tone="emerald">making things fast</Mark>, and <Mark tone="indigo">operations</Mark>.
        Currently building infrastructure and systems at <Mark tone="quiet">Stablecore</Mark>. I also
        enjoy hardware, Nix, and collecting things that are nice to look at.
      </Prose>
    </Stack>
  )
}
