import * as stylex from '@stylexjs/stylex'
import type { ComponentProps } from 'react'
import { breakpoints, colors, controls, motion, radius, space, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  input: {
    minWidth: 0,
    height: { default: controls.target, [breakpoints.coarse]: controls.targetTouch },
    paddingInline: space.sm,
    backgroundColor: 'transparent',
    color: colors.ink,
    fontFamily: 'inherit',
    fontSize: { default: typography.sizeSmall, [breakpoints.coarse]: '1rem' },
    '::placeholder': { color: colors.muted, opacity: 0.8 },
  },
  outlined: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: colors.line,
      ':focus-visible': colors.accent,
    },
    borderRadius: radius.sm,
    outline: {
      default: 'none',
      ':focus-visible': `1px solid ${colors.accent}`,
    },
    transitionProperty: 'border-color',
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.easeColor,
  },
  bare: {
    flexGrow: 1,
    borderWidth: 0,
    outline: 'none',
  },
  invalid: {
    borderColor: `color-mix(in oklch, ${colors.accent} 60%, ${colors.line})`,
  },
})

type InputProps = Omit<ComponentProps<'input'>, 'className' | 'style'> & {
  variant?: 'outlined' | 'bare'
  invalid?: boolean
}

export function Input({ variant = 'outlined', invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      {...props}
      {...stylex.props(styles.input, styles[variant], invalid && variant === 'outlined' && styles.invalid)}
    />
  )
}
