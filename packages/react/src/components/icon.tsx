import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { controls } from '../styles/theme.stylex'

const BRAND_VIEWBOX = '-2 -2 28 28'
const SOLID_VIEWBOX = '-3.5 -3.5 31 31'
const GLYPH_VIEWBOX = '0 0 24 24'

type IconDef = { brand: boolean; viewBox?: string; body: ReactNode }

const icons = {
  github: {
    brand: true,
    body: (
      <path d="M12 .297A12 12 0 0 0 8.207 23.68c.6.111.82-.261.82-.577 0-.286-.011-1.04-.017-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.333-1.755-1.333-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.303-5.466-1.333-5.466-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 6.088c1.02.005 2.046.138 3.004.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.769.84 1.234 1.911 1.234 3.221 0 4.609-2.805 5.624-5.478 5.921.43.37.814 1.103.814 2.222 0 1.606-.015 2.9-.015 3.293 0 .319.216.694.825.576A12 12 0 0 0 12 .297" />
    ),
  },
  gitlab: {
    brand: true,
    body: (
      <path d="m22.65 14.39-10.65 7.74L1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51a.4.4 0 0 1 .77 0l2.44 7.51h8.16l2.44-7.51a.4.4 0 0 1 .77 0l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94Z" />
    ),
  },
  x: {
    brand: true,
    body: (
      <path d="M13.9 10.47 21.35 2h-1.76l-6.47 7.35L7.96 2H2l7.81 11.12L2 22h1.76l6.83-7.77L16.04 22H22zM11.48 13.21l-.79-1.1L4.4 3.3h2.72l5.08 7.11.79 1.1 6.6 9.24h-2.72z" />
    ),
  },
  linkedin: {
    brand: true,
    viewBox: SOLID_VIEWBOX,
    body: (
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.048c.475-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0Z" />
    ),
  },
  mail: {
    brand: false,
    body: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      </>
    ),
  },

  rss: {
    brand: false,
    body: (
      <>
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </>
    ),
  },

  sun: {
    brand: false,
    body: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </>
    ),
  },

  moon: {
    brand: false,
    body: (
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    ),
  },

} satisfies Record<string, IconDef>

export type IconName = keyof typeof icons

const styles = stylex.create({
  icon: {
    display: 'block',
    flexShrink: 0,
  },
  sm: { width: controls.iconSm, height: controls.iconSm },
  md: { width: controls.iconMd, height: controls.iconMd },
  lg: { width: controls.iconLg, height: controls.iconLg },
})

export function Icon({ name, size = 'md' }: { name: IconName; size?: 'sm' | 'md' | 'lg' }) {
  const { brand, viewBox, body }: IconDef = icons[name]

  return (
    <svg
      {...stylex.props(styles.icon, styles[size])}
      viewBox={viewBox ?? (brand ? BRAND_VIEWBOX : GLYPH_VIEWBOX)}
      fill={brand ? 'currentColor' : 'none'}
      stroke={brand ? undefined : 'currentColor'}
      strokeWidth={brand ? undefined : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  )
}
