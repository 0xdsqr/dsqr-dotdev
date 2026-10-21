import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { layout, space } from '../styles/theme.stylex'

const styles = stylex.create({
  stack: {
    display: 'grid',
    maxWidth: layout.measure,
  },
  start: { justifyItems: 'start', textAlign: 'start' },
  center: { justifyItems: 'center', textAlign: 'center' },
  sm: { gap: space.sm },
  md: { gap: space.md },
  lg: { gap: space.lg },
})

export function Stack({
  align = 'start',
  gap = 'md',
  labelledBy,
  children,
}: {
  align?: 'start' | 'center'
  gap?: 'sm' | 'md' | 'lg'
  labelledBy?: string
  children: ReactNode
}) {
  const props = stylex.props(styles.stack, styles[align], styles[gap])
  return labelledBy ? (
    <section aria-labelledby={labelledBy} {...props}>
      {children}
    </section>
  ) : (
    <div {...props}>{children}</div>
  )
}
