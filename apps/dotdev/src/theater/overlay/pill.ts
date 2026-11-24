import { breakpoints, controls, motion, typography } from '@dsqr-dotdev/react/theme.stylex'
import * as stylex from '@stylexjs/stylex'
import { chrome } from '../chrome.stylex'

export const pill = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '0.6rem',
    minHeight: { default: '2.25rem', [breakpoints.coarse]: controls.targetTouch },
    paddingInline: '0.5rem',
    borderWidth: 0,
    borderRadius: '0.5rem',
    backgroundColor: 'transparent',
    color: {
      default: chrome.ink,
      ':hover': { default: null, [breakpoints.hover]: chrome.inkHot },
      ':focus-visible': chrome.inkHot,
    },
    textShadow: {
      default: chrome.textGlow,
      ':hover': { default: null, [breakpoints.hover]: chrome.textGlowHot },
      ':focus-visible': chrome.textGlowHot,
    },
    fontFamily: typography.mono,
    fontSize: '0.8rem',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transitionProperty: 'color, text-shadow',
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.easeColor,
    outline: { default: null, ':focus-visible': `2px solid ${chrome.edgeHot}` },
    outlineOffset: '2px',
    WebkitTapHighlightColor: 'transparent',
  },
  key: {
    paddingInline: '0.35rem',
    borderRadius: '0.3rem',
    backgroundColor: chrome.tint,
    color: chrome.muted,
    textShadow: 'none',
    fontFamily: typography.mono,
    fontSize: '0.75rem',
  },
})
