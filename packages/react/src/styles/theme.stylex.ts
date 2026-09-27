import * as stylex from '@stylexjs/stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// Preserve the purple palette from master; evolve shared values here.
export const colors = stylex.defineVars({
  background: {
    default: 'oklch(0.994 0 0)',
    [DARK]: 'oklch(0.2223 0.006 271.1393)',
  },
  foreground: {
    default: 'oklch(0 0 0)',
    [DARK]: 'oklch(0.9551 0 0)',
  },
  primary: {
    default: 'oklch(0.5393 0.2713 286.7462)',
    [DARK]: 'oklch(0.6132 0.2294 291.7437)',
  },
})

export const typography = stylex.defineVars({
  sans: '"Geist Sans", system-ui, sans-serif',
  tracking: '-0.025em',
  headingSize: '2rem',
  headingWeight: '500',
})
