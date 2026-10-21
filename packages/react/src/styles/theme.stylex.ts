import * as stylex from '@stylexjs/stylex'

export const colors = stylex.defineVars({
  ground: 'light-dark(oklch(0.994 0 0), oklch(0.2223 0.006 271.1393))',
  surface: 'light-dark(oklch(0.9702 0 0), oklch(0.2568 0.0076 274.6528))',
  ink: 'light-dark(oklch(0 0 0), oklch(0.9551 0 0))',
  muted: 'light-dark(oklch(0.4386 0 0), oklch(0.7058 0 0))',
  line: 'light-dark(oklch(0.93 0.0094 286.2156), oklch(0.3289 0.0092 268.3843))',
  accent: 'light-dark(oklch(0.5393 0.2713 286.7462), oklch(0.6132 0.2294 291.7437))',
})

export const hues = stylex.defineVars({
  teal: 'light-dark(oklch(0.6 0.118 184.704), oklch(0.777 0.152 181.912))',
  orange: 'light-dark(oklch(0.646 0.222 41.116), oklch(0.837 0.128 66.29))',
  emerald: 'light-dark(oklch(0.596 0.145 163.225), oklch(0.765 0.177 163.223))',
  indigo: 'light-dark(oklch(0.511 0.262 276.966), oklch(0.673 0.182 276.935))',
})

export const typography = stylex.defineVars({
  sans: '"Geist Variable", system-ui, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, monospace',
  weightBody: '400',
  weightMedium: '500',
  weightStrong: '540',
  sizeCaption: '0.75rem',
  sizeSmall: '0.875rem',
  sizeBody: '1.0625rem',
  sizeProse: 'clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',
  sizeH1: 'clamp(1.75rem, 1.45rem + 1.25vw, 2.2rem)',
  sizeH2: 'clamp(1.35rem, 1.25rem + 0.5vw, 1.5rem)',
  sizeH3: '1.2rem',
  leadingBody: '1.6',
  leadingProse: '2',
  leadingTight: '1.2',
  trackingSmall: '0em',
  trackingBody: '-0.006em',
  trackingTight: '-0.022em',
})

export const space = stylex.defineVars({
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
  section: 'clamp(2.5rem, 6vw, 4.5rem)',
  gutter: 'clamp(1.25rem, 4vw, 2rem)',
})

export const layout = stylex.defineVars({
  content: '48rem',
  measure: '42rem',
})

export const breakpoints = stylex.defineConsts({
  narrow: '@media (max-width: 30rem)',
  coarse: '@media (any-pointer: coarse)',
  hover: '@media (hover: hover)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
})

export const controls = stylex.defineConsts({
  iconSm: '1rem',
  iconMd: '1.125rem',
  iconLg: '1.25rem',
  target: '2rem',
  targetTouch: '2.75rem',
})

export const radius = stylex.defineVars({
  sm: '6px',
  md: '10px',
  lg: '16px',
})

export const elevation = stylex.defineVars({
  raised:
    '0 2px 3px light-dark(oklch(0 0 0 / 0.16), oklch(0 0 0 / 0.4)), 0 1px 2px -1px light-dark(oklch(0 0 0 / 0.16), oklch(0 0 0 / 0.4))',
})

export const motion = stylex.defineVars({
  fast: '150ms',
  base: '220ms',
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeColor: 'ease',
})
