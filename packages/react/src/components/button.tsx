import * as stylex from '@stylexjs/stylex'
import type { ComponentProps } from 'react'
import { breakpoints, colors, controls, motion, radius, space, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  button: {
    flexShrink: 0,
    borderWidth: 0,
    fontFamily: 'inherit',
    fontSize: typography.sizeSmall,
    cursor: { default: 'pointer', ':disabled': 'default' },
    outline: {
      default: null,
      ':focus-visible': `2px solid ${colors.accent}`,
    },
    transform: {
      default: null,
      ':active': { default: 'scale(0.97)', [breakpoints.reducedMotion]: null },
    },
    transitionDuration: motion.fast,
    transitionTimingFunction: `${motion.easeColor}, ${motion.easeOut}`,
    WebkitTapHighlightColor: 'transparent',
  },
  solid: {
    height: { default: controls.target, [breakpoints.coarse]: controls.targetTouch },
    paddingInline: space.md,
    borderRadius: radius.sm,
    backgroundColor: {
      default: colors.ink,
      ':hover': { default: null, [breakpoints.hover]: colors.accent },
      ':focus-visible': colors.accent,
    },
    color: colors.ground,
    fontWeight: typography.weightMedium,
    opacity: { default: 1, ':disabled': 0.6 },
    outlineOffset: '2px',
    transitionProperty: 'background-color, transform',
  },
  quiet: {
    alignSelf: 'stretch',
    marginBlock: '2px',
    paddingInline: space.sm,
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: {
      default: colors.muted,
      ':hover': { default: null, [breakpoints.hover]: colors.accent },
      ':focus-visible': colors.accent,
      ':disabled': colors.muted,
    },
    outlineOffset: '-2px',
    transitionProperty: 'color, transform',
  },
})

type ButtonProps = Omit<ComponentProps<'button'>, 'className' | 'style'> & {
  variant?: 'solid' | 'quiet'
}

export function Button({ variant = 'solid', ...props }: ButtonProps) {
  return <button type="button" {...props} {...stylex.props(styles.button, styles[variant])} />
}
