import * as stylex from '@stylexjs/stylex'

// The dsqr palette from master: near-white and black in light, a cool
// grey-black in dark, and the purple primary as the accent. Each value is
// light-dark(light, dark): the `color-scheme` on <html> picks the side, so the
// system preference and the theme toggle share one palette.
export const colors = stylex.defineVars({
  ground: 'light-dark(oklch(0.994 0 0), oklch(0.2223 0.006 271.1393))',
  surface: 'light-dark(oklch(0.9702 0 0), oklch(0.2568 0.0076 274.6528))',
  ink: 'light-dark(oklch(0 0 0), oklch(0.9551 0 0))',
  muted: 'light-dark(oklch(0.4386 0 0), oklch(0.7058 0 0))',
  line: 'light-dark(oklch(0.93 0.0094 286.2156), oklch(0.3289 0.0092 268.3843))',
  accent: 'light-dark(oklch(0.5393 0.2713 286.7462), oklch(0.6132 0.2294 291.7437))',
})

// master's highlight hues for tagging words in prose (Tailwind 600 in light,
// 300/400 in dark). Decorative text color only; the accent stays for actions.
export const hues = stylex.defineVars({
  teal: 'light-dark(oklch(0.6 0.118 184.704), oklch(0.777 0.152 181.912))',
  orange: 'light-dark(oklch(0.646 0.222 41.116), oklch(0.837 0.128 66.29))',
  emerald: 'light-dark(oklch(0.596 0.145 163.225), oklch(0.765 0.177 163.223))',
  indigo: 'light-dark(oklch(0.511 0.262 276.966), oklch(0.673 0.182 276.935))',
})

// Geist for interface text, Geist Mono for prose on the home page (as on master).
export const typography = stylex.defineVars({
  sans: '"Geist Variable", system-ui, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, monospace',
  weightBody: '400',
  weightMedium: '500',
  weightStrong: '540',
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

// 4px-based scale; `section` and `gutter` flex with the viewport.
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

// `content` is the page column every region aligns to (master's 3xl);
// `measure` caps running text at a comfortable line length inside it.
export const layout = stylex.defineVars({
  content: '48rem',
  measure: '42rem',
})

// Media queries cannot read custom properties, so breakpoints are constants.
export const breakpoints = stylex.defineConsts({
  narrow: '@media (max-width: 30rem)',
  coarse: '@media (any-pointer: coarse)',
  hover: '@media (hover: hover)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
})

// Control geometry shared by icons and the targets around them. Constants so
// components can derive layout math (like edge trims) from them at compile time.
// 32px pointer targets keep icon rows grouped (gap ≈ glyph width) and clear the
// WCAG 24px minimum; any coarse pointer gets 44px.
export const controls = stylex.defineConsts({
  iconSm: '1rem',
  iconMd: '1.125rem',
  iconLg: '1.25rem',
  target: '2rem',
  targetTouch: '2.75rem',
})

// Rounding follows hierarchy: controls small, surfaces larger.
export const radius = stylex.defineVars({
  sm: '6px',
  md: '10px',
  lg: '16px',
})

// Depth is rare: master's small lift for a framed surface like the portrait.
export const elevation = stylex.defineVars({
  raised:
    '0 2px 3px light-dark(oklch(0 0 0 / 0.16), oklch(0 0 0 / 0.4)), 0 1px 2px -1px light-dark(oklch(0 0 0 / 0.16), oklch(0 0 0 / 0.4))',
})

// Motion answers the user. Curves are Emil Kowalski's (see the animate skill):
// a strong ease-out for anything entering, leaving, or pressed; plain `ease` for
// hover and color. Reduced motion keeps fades and drops movement: components
// gate their transforms on `breakpoints.reducedMotion`.
export const motion = stylex.defineVars({
  fast: '150ms',
  base: '220ms',
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeColor: 'ease',
})
