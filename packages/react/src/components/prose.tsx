import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  // The home-page voice (from master): Geist Mono, muted, generously leaded,
  // so marked phrases and links carry the emphasis.
  prose: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.sizeProse,
    lineHeight: typography.leadingProse,
    textWrap: 'pretty',
  },
})

export function Prose({ children }: { children: ReactNode }) {
  return <p {...stylex.props(styles.prose)}>{children}</p>
}
