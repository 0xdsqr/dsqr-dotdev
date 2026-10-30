import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import { type Destination, destinations } from '../../content/destinations'
import { chrome } from './chrome.stylex'
import { pill } from './pill'

const bounce = stylex.keyframes({
  '0%': { transform: 'scaleY(0.35)' },
  '50%': { transform: 'scaleY(1)' },
  '100%': { transform: 'scaleY(0.35)' },
})

const styles = stylex.create({
  root: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 30,
  },
  bars: {
    display: 'inline-flex',
    alignItems: 'flex-end',
    columnGap: '2px',
    height: '0.75rem',
  },
  bar: {
    width: '3px',
    height: '100%',
    borderRadius: '1px',
    backgroundColor: chrome.violet,
    transformOrigin: 'bottom',
    animationName: { default: bounce, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '0.625s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    display: 'grid',
    rowGap: '0.15rem',
    minWidth: '15rem',
    padding: '0.4rem',
    borderRadius: '1rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: chrome.edge,
    backgroundColor: chrome.glassStrong,
    backdropFilter: 'blur(14px)',
    boxShadow: chrome.glow,
    transformOrigin: 'top left',
    transitionProperty: 'opacity, transform',
    transitionDuration: { default: '160ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  closed: {
    opacity: 0,
    visibility: 'hidden',
    transitionProperty: 'opacity, transform, visibility',
    transitionDelay: { default: '0s, 0s, 160ms', '@media (prefers-reduced-motion: reduce)': '0s' },
    transform: 'translateY(-4px) scale(0.98)',
    pointerEvents: 'none',
  },
  item: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    columnGap: '0.7rem',
    paddingBlock: '0.6rem',
    paddingInline: '0.7rem',
    borderRadius: '0.65rem',
    borderWidth: 0,
    backgroundColor: { default: 'transparent', ':hover': chrome.tint, ':focus-visible': chrome.tint },
    color: chrome.ink,
    fontFamily: chrome.mono,
    fontSize: '0.84rem',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    outline: 'none',
  },
  led: {
    width: '0.42rem',
    height: '0.42rem',
    borderRadius: '50%',
    backgroundColor: chrome.led,
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '160ms',
  },
  hint: {
    color: chrome.muted,
    fontSize: '0.72rem',
  },
  divider: {
    height: '1px',
    marginBlock: '0.25rem',
    marginInline: '0.6rem',
    backgroundColor: chrome.tint,
  },
})

const lit = stylex.create({
  on: { backgroundColor: chrome.ledOn, boxShadow: `0 0 8px ${chrome.ledOn}` },
})

function MenuItem({
  label,
  hint,
  to,
  onClick,
}: {
  label: string
  hint?: string
  to?: Destination['href']
  onClick?: () => void
}) {
  const [hot, setHot] = useState(false)
  const handlers = {
    onPointerEnter: () => setHot(true),
    onPointerLeave: () => setHot(false),
    onFocus: () => setHot(true),
    onBlur: () => setHot(false),
  }
  const content = (
    <>
      <span {...stylex.props(styles.led, hot && lit.on)} />
      {label}
      <span {...stylex.props(styles.hint)}>{hint}</span>
    </>
  )
  return to ? (
    <Link to={to} {...handlers} {...stylex.props(styles.item)}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} {...handlers} {...stylex.props(styles.item)}>
      {content}
    </button>
  )
}

export function SiteMenu({ onEnterBooth }: { onEnterBooth: () => void }) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() =>
      root.current?.querySelector<HTMLElement>('nav a, nav button')?.focus({ preventScroll: true }),
    )
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      root.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey, { capture: true })
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey, { capture: true })
    }
  }, [open])

  return (
    <div ref={root} {...stylex.props(styles.root)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((value) => !value)}
        {...stylex.props(pill.base)}
      >
        <span aria-hidden="true" {...stylex.props(styles.bars)}>
          {[0, 0.18, 0.36].map((delay) => (
            <span key={delay} style={{ animationDelay: `${delay}s` }} {...stylex.props(styles.bar)} />
          ))}
        </span>
        Menu
      </button>
      <nav id={panel} aria-label="Site" {...stylex.props(styles.panel, !open && styles.closed)}>
        {destinations.map((destination) => (
          <MenuItem key={destination.id} label={destination.label} hint={destination.hint} to={destination.href} />
        ))}
        <div {...stylex.props(styles.divider)} />
        <MenuItem
          label="Control room"
          hint="Enter"
          onClick={() => {
            setOpen(false)
            onEnterBooth()
          }}
        />
      </nav>
    </div>
  )
}
