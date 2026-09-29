import * as stylex from '@stylexjs/stylex'

// Text for screen readers only: read aloud, never shown, never affecting layout.
export const visuallyHidden = stylex.create({
  base: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
})
