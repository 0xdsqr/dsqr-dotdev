import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, hues, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  mark: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
  },
  accent: { color: colors.accent, textDecorationColor: `color-mix(in oklch, ${colors.accent} 50%, transparent)` },
  teal: { color: hues.teal, textDecorationColor: `color-mix(in oklch, ${hues.teal} 50%, transparent)` },
  orange: { color: hues.orange, textDecorationColor: `color-mix(in oklch, ${hues.orange} 50%, transparent)` },
  emerald: { color: hues.emerald, textDecorationColor: `color-mix(in oklch, ${hues.emerald} 50%, transparent)` },
  indigo: { color: hues.indigo, textDecorationColor: `color-mix(in oklch, ${hues.indigo} 50%, transparent)` },
  emphasis: { color: colors.ink, textDecorationColor: `color-mix(in oklch, ${colors.accent} 50%, transparent)` },
  quiet: {
    color: colors.ink,
    fontWeight: typography.weightMedium,
    textDecorationColor: colors.line,
  },
})

export type MarkTone = 'accent' | 'teal' | 'orange' | 'emerald' | 'indigo' | 'emphasis' | 'quiet'

export function Mark({ tone = 'emphasis', children }: { tone?: MarkTone; children: ReactNode }) {
  return <span {...stylex.props(styles.mark, styles[tone])}>{children}</span>
}
