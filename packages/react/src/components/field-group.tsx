import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { breakpoints, colors, controls, motion, radius } from '../styles/theme.stylex'

const styles = stylex.create({
  group: {
    display: 'flex',
    alignItems: 'center',
    height: { default: controls.target, [breakpoints.coarse]: controls.targetTouch },
    paddingInlineEnd: '2px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: colors.line,
      ':focus-within': colors.accent,
    },
    borderRadius: radius.sm,
    transitionProperty: 'border-color',
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.easeColor,
  },
  invalid: {
    borderColor: `color-mix(in oklch, ${colors.accent} 60%, ${colors.line})`,
  },
})

export function FieldGroup({ invalid, children }: { invalid?: boolean; children: ReactNode }) {
  return <div {...stylex.props(styles.group, invalid && styles.invalid)}>{children}</div>
}
