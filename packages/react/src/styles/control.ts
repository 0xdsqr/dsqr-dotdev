import * as stylex from '@stylexjs/stylex'
import { breakpoints, colors, controls, motion, radius } from './theme.stylex'

// Icon-only controls (links and buttons): muted at rest; the accent on hover and
// focus, since it marks what is clickable; a 2px accent ring for keyboard focus;
// a small press. Targets are 32px, 44px on any coarse pointer.
export const iconControl = stylex.create({
  base: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: { default: controls.target, [breakpoints.coarse]: controls.targetTouch },
    height: { default: controls.target, [breakpoints.coarse]: controls.targetTouch },
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    color: {
      default: 'inherit',
      ':hover': { default: null, [breakpoints.hover]: colors.accent },
      ':focus-visible': colors.accent,
    },
    cursor: 'pointer',
    outline: {
      default: null,
      ':focus-visible': `2px solid ${colors.accent}`,
    },
    outlineOffset: {
      default: null,
      ':focus-visible': '-2px',
    },
    transform: {
      default: null,
      ':active': { default: 'scale(0.92)', [breakpoints.reducedMotion]: null },
    },
    transitionProperty: 'color, transform',
    transitionDuration: motion.fast,
    transitionTimingFunction: `${motion.easeColor}, ${motion.easeOut}`,
    WebkitTapHighlightColor: 'transparent',
  },
})
