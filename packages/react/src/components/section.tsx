import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { space } from '../styles/theme.stylex'

const styles = stylex.create({
  section: {
    display: 'grid',
    alignContent: 'start',
    gap: space.md,
  },
})

export function Section({ children }: { children: ReactNode }) {
  return <section {...stylex.props(styles.section)}>{children}</section>
}
