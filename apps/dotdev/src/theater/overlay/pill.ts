import * as stylex from '@stylexjs/stylex'
import { chrome } from './chrome.stylex'

export const pill = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '0.6rem',
    height: '2.25rem',
    paddingInline: '0.5rem',
    borderWidth: 0,
    borderRadius: '0.5rem',
    backgroundColor: 'transparent',
    color: { default: chrome.ink, ':hover': '#ffffff' },
    textShadow: { default: '0 0 14px rgba(139, 92, 246, 0.55)', ':hover': '0 0 18px rgba(196, 181, 253, 0.9)' },
    fontFamily: chrome.mono,
    fontSize: '0.8rem',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    transitionProperty: 'color, text-shadow',
    transitionDuration: '160ms',
    outline: { ':focus-visible': `2px solid ${chrome.edgeHot}` },
    outlineOffset: '2px',
  },
  key: {
    paddingInline: '0.35rem',
    borderRadius: '0.3rem',
    backgroundColor: chrome.tint,
    color: chrome.muted,
    textShadow: 'none',
    fontFamily: chrome.mono,
    fontSize: '0.68rem',
  },
})
