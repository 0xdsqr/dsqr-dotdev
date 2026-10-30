import * as stylex from '@stylexjs/stylex'
import { chrome } from './chrome.stylex'

export const pill = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '0.55rem',
    height: '2.25rem',
    paddingInline: '0.95rem',
    borderRadius: '999px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: chrome.edge, ':hover': chrome.edgeHot },
    backgroundColor: chrome.glass,
    backdropFilter: 'blur(10px)',
    boxShadow: chrome.glow,
    color: chrome.ink,
    fontFamily: chrome.mono,
    fontSize: '0.78rem',
    letterSpacing: '0.01em',
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '160ms',
    outline: { ':focus-visible': `2px solid ${chrome.edgeHot}` },
    outlineOffset: '3px',
  },
  key: {
    paddingInline: '0.35rem',
    borderRadius: '0.3rem',
    backgroundColor: chrome.tint,
    color: chrome.muted,
    fontFamily: chrome.mono,
    fontSize: '0.7rem',
  },
})
