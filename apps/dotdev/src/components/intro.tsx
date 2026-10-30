import { Mark } from '@dsqr-dotdev/react/components/mark'
import { Prose } from '@dsqr-dotdev/react/components/prose'
import { Stack } from '@dsqr-dotdev/react/components/stack'
import { visuallyHidden } from '@dsqr-dotdev/react/visually-hidden'
import * as stylex from '@stylexjs/stylex'
import { Fragment } from 'react'
import portraitAvif from '../assets/portrait.avif'
import portraitWebp from '../assets/portrait.webp'
import { handle, intro } from '../content/intro'

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
        {handle}
      </h1>
      <picture>
        <source srcSet={portraitAvif} type="image/avif" />
        <img
          src={portraitWebp}
          alt={`Portrait of ${handle}`}
          width={480}
          height={601}
          fetchPriority="high"
          decoding="async"
          {...stylex.props(styles.portrait)}
        />
      </picture>
      <Prose>
        {intro.map((segment, index) =>
          segment.tone ? (
            <Mark key={index} tone={segment.tone}>
              {segment.text}
            </Mark>
          ) : (
            <Fragment key={index}>{segment.text}</Fragment>
          ),
        )}
      </Prose>
    </Stack>
  )
}
