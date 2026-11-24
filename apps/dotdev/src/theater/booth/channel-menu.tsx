import { breakpoints, motion, typography } from '@dsqr-dotdev/react/theme.stylex'
import { Html } from '@react-three/drei'
import * as stylex from '@stylexjs/stylex'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { type Destination, destinations } from '../../content/destinations'
import { chrome } from '../chrome.stylex'
import { deskTilt, deskY, deskZ } from './geometry'

const faderTravel = 360

const styles = stylex.create({
  menu: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '8.5rem',
    columnGap: '0.75rem',
    margin: 0,
    padding: '1rem',
    listStyle: 'none',
    borderRadius: '0.9rem',
    backgroundColor: chrome.glassStrong,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: chrome.edge,
    boxShadow: chrome.glow,
    fontFamily: typography.mono,
    color: chrome.ink,
    userSelect: 'none',
  },
  channel: {
    display: 'grid',
    justifyItems: 'center',
    rowGap: '0.6rem',
    paddingBlock: '0.85rem',
    paddingInline: '0.5rem',
    borderRadius: '0.6rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: chrome.edgeSoft,
      ':hover': { default: null, [breakpoints.hover]: chrome.edgeHot },
      ':focus-visible': chrome.edgeHot,
    },
    backgroundColor: {
      default: chrome.fader,
      ':hover': { default: null, [breakpoints.hover]: chrome.faderHot },
      ':focus-visible': chrome.faderHot,
    },
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.easeColor,
    outline: { default: null, ':focus-visible': `2px solid ${chrome.focus}` },
    outlineOffset: '3px',
    WebkitTapHighlightColor: 'transparent',
  },
  led: {
    width: '0.45rem',
    height: '0.45rem',
    borderRadius: '50%',
    backgroundColor: chrome.led,
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: motion.base,
  },
  ledOn: { backgroundColor: chrome.ledOn, boxShadow: `0 0 10px ${chrome.ledOn}` },
  track: {
    position: 'relative',
    width: '0.35rem',
    height: '5.5rem',
    borderRadius: '999px',
    backgroundColor: chrome.track,
  },
  knob: {
    position: 'absolute',
    left: '50%',
    bottom: '0.2rem',
    width: '1.6rem',
    height: '0.7rem',
    marginLeft: '-0.8rem',
    borderRadius: '0.2rem',
    backgroundColor: chrome.ink,
    boxShadow: chrome.knobGlow,
    transform: 'translateY(0)',
    transitionProperty: 'transform',
    transitionDuration: { default: chrome.slow, [breakpoints.reducedMotion]: '0s' },
    transitionTimingFunction: motion.easeOut,
  },
  knobUp: { transform: 'translateY(-4.4rem)' },
  label: { fontSize: '1rem', fontWeight: 600 },
  hint: { fontSize: '0.75rem', color: chrome.muted },
})

function opensElsewhere(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function Channel({
  destination,
  active,
  autoFocus,
  onPick,
}: {
  destination: Destination
  active: boolean
  autoFocus: boolean
  onPick: (destination: Destination) => void
}) {
  const [hot, setHot] = useState(false)
  const link = useRef<HTMLAnchorElement>(null)
  const up = hot || active

  // Entering the booth moves focus here, so keyboard users land on the menu they opened.
  useEffect(() => {
    if (autoFocus) link.current?.focus({ preventScroll: true })
  }, [autoFocus])

  return (
    <li>
      <a
        ref={link}
        href={destination.href}
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => setHot(false)}
        onFocus={() => setHot(true)}
        onBlur={() => setHot(false)}
        onClick={(event) => {
          if (opensElsewhere(event)) return
          event.preventDefault()
          onPick(destination)
        }}
        {...stylex.props(styles.channel)}
      >
        <span aria-hidden="true" {...stylex.props(styles.led, up && styles.ledOn)} />
        <span aria-hidden="true" {...stylex.props(styles.track)}>
          <span {...stylex.props(styles.knob, up && styles.knobUp)} />
        </span>
        <span {...stylex.props(styles.label)}>{destination.label}</span>
        <span {...stylex.props(styles.hint)}>{destination.hint}</span>
      </a>
    </li>
  )
}

export function ChannelMenu({ onSelect }: { onSelect: (destination: Destination) => void }) {
  const [picked, setPicked] = useState<Destination['id'] | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const pick = (destination: Destination) => {
    setPicked(destination.id)
    window.clearTimeout(timer.current)
    // Let the fader finish its throw, unless motion is reduced.
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : faderTravel
    timer.current = window.setTimeout(() => onSelect(destination), delay)
  }

  return (
    <Html
      transform
      position={[0, deskY + 0.62, deskZ - 0.05]}
      rotation={[-deskTilt - 0.5, 0, 0]}
      distanceFactor={1.25}
      zIndexRange={[20, 0]}
    >
      <nav aria-label="Control room">
        <ul {...stylex.props(styles.menu)}>
          {destinations.map((destination, index) => (
            <Channel
              key={destination.id}
              destination={destination}
              active={picked === destination.id}
              autoFocus={index === 0}
              onPick={pick}
            />
          ))}
        </ul>
      </nav>
    </Html>
  )
}
