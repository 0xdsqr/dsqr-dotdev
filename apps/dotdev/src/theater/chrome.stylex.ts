import * as stylex from '@stylexjs/stylex'

/**
 * The theater's DOM chrome. The stage is always night, so these are fixed values
 * rather than light-dark() pairs; 3D material colors live in `lib/palette.ts`.
 */
export const chrome = stylex.defineVars({
  night: '#07050d',
  haze: '#0d0818',
  spill: '#2a1450',
  ink: '#ede9fe',
  inkHot: '#ffffff',
  muted: '#a79bd0',
  glass: 'rgba(13, 8, 24, 0.72)',
  glassStrong: 'rgba(13, 8, 24, 0.9)',
  edge: 'rgba(139, 92, 246, 0.4)',
  edgeSoft: 'rgba(196, 181, 253, 0.18)',
  edgeHot: 'rgba(196, 181, 253, 0.8)',
  focus: '#c4b5fd',
  tint: 'rgba(139, 92, 246, 0.16)',
  track: 'rgba(196, 181, 253, 0.16)',
  fader: 'rgba(28, 18, 52, 0.6)',
  faderHot: 'rgba(52, 30, 96, 0.75)',
  glow: '0 0 24px rgba(139, 92, 246, 0.28)',
  textGlow: '0 0 14px rgba(139, 92, 246, 0.55)',
  textGlowHot: '0 0 18px rgba(196, 181, 253, 0.9)',
  barGlow: '0 0 8px rgba(139, 92, 246, 0.8)',
  knobGlow: '0 0 12px rgba(139, 92, 246, 0.7)',
  led: '#3b2a6b',
  ledOn: '#5eead4',
  violet: '#8b5cf6',
  slow: '320ms',
})

/** The night sky behind the stage and below it (the footer's encore). */
export const backdrops = stylex.defineConsts({
  stage: 'radial-gradient(120% 80% at 50% 35%, #2a1450 0%, #0d0818 55%, #07050d 100%)',
  encore: 'linear-gradient(to bottom, #07050d, #0d0818)',
})
