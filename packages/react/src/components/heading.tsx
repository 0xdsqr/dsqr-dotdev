import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  heading: {
    color: colors.ink,
    fontWeight: typography.weightStrong,
    lineHeight: typography.leadingTight,
    letterSpacing: typography.trackingTight,
    textWrap: 'balance',
  },
  1: { fontSize: typography.sizeH1 },
  2: { fontSize: typography.sizeH2 },
  3: { fontSize: typography.sizeH3 },
})

const tags = { 1: 'h1', 2: 'h2', 3: 'h3' } as const

export function Heading({
  level = 1,
  id,
  children,
}: {
  level?: 1 | 2 | 3
  id?: string
  children: ReactNode
}) {
  const Tag = tags[level]
  return (
    <Tag id={id} {...stylex.props(styles.heading, styles[level])}>
      {children}
    </Tag>
  )
}
