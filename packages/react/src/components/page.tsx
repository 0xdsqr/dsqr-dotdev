import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  page: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    padding: '1.5rem',
    backgroundColor: colors.background,
    color: colors.foreground,
    fontFamily: typography.sans,
    letterSpacing: typography.tracking,
  },
})

export function Page({ children }: { children: ReactNode }) {
  return <main {...stylex.props(styles.page)}>{children}</main>
}
