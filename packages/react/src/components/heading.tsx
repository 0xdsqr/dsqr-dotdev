import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  heading: {
    margin: 0,
    color: colors.primary,
    fontSize: typography.headingSize,
    fontWeight: typography.headingWeight,
    lineHeight: 1.2,
    textAlign: 'center',
  },
})

export function Heading({ children }: { children: ReactNode }) {
  return <h1 {...stylex.props(styles.heading)}>{children}</h1>
}
