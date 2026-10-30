import { Html } from '@react-three/drei'
import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { type Destination, destinations } from '../../content/destinations'
import { deskTilt, deskY, deskZ } from './geometry'

const styles = stylex.create({
  menu: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 7.5rem)',
    columnGap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.9rem',
    backgroundColor: 'rgba(10, 6, 20, 0.82)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(139, 92, 246, 0.45)',
    boxShadow: '0 0 40px rgba(139, 92, 246, 0.25)',
    fontFamily: '"Geist Mono Variable", ui-monospace, monospace',
    color: '#ede9fe',
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
    borderColor: 'rgba(196, 181, 253, 0.18)',
    backgroundColor: 'rgba(28, 18, 52, 0.6)',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color, transform',
    transitionDuration: '180ms',
    ':hover': { borderColor: 'rgba(196, 181, 253, 0.7)', backgroundColor: 'rgba(52, 30, 96, 0.75)' },
    ':focus-visible': { outline: '2px solid #c4b5fd', outlineOffset: '3px' },
  },
  led: {
    width: '0.45rem',
    height: '0.45rem',
    borderRadius: '50%',
    backgroundColor: '#3b2a6b',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '180ms',
  },
  ledOn: { backgroundColor: '#5eead4', boxShadow: '0 0 10px #5eead4' },
  track: {
    position: 'relative',
    width: '0.35rem',
    height: '5.5rem',
    borderRadius: '999px',
    backgroundColor: 'rgba(196, 181, 253, 0.16)',
  },
  knob: {
    position: 'absolute',
    left: '50%',
    bottom: '0.2rem',
    width: '1.6rem',
    height: '0.7rem',
    marginLeft: '-0.8rem',
    borderRadius: '0.2rem',
    backgroundColor: '#ede9fe',
    boxShadow: '0 0 12px rgba(139, 92, 246, 0.7)',
    transitionProperty: 'bottom',
    transitionDuration: '320ms',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  knobUp: { bottom: '4.6rem' },
  label: { fontSize: '1rem', fontWeight: 600 },
  hint: { fontSize: '0.68rem', color: '#a79bd0' },
})

function Channel({
  destination,
  active,
  onPick,
}: {
  destination: Destination
  active: boolean
  onPick: (destination: Destination) => void
}) {
  const [hot, setHot] = useState(false)
  const up = hot || active
  return (
    <button
      type="button"
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      onClick={() => onPick(destination)}
      {...stylex.props(styles.channel)}
    >
      <span {...stylex.props(styles.led, up && styles.ledOn)} />
      <span {...stylex.props(styles.track)}>
        <span {...stylex.props(styles.knob, up && styles.knobUp)} />
      </span>
      <span {...stylex.props(styles.label)}>{destination.label}</span>
      <span {...stylex.props(styles.hint)}>{destination.hint}</span>
    </button>
  )
}

export function ChannelMenu({ onSelect }: { onSelect: (destination: Destination) => void }) {
  const [picked, setPicked] = useState<Destination['id'] | null>(null)
  const pick = (destination: Destination) => {
    setPicked(destination.id)
    window.setTimeout(() => onSelect(destination), 360)
  }
  return (
    <Html
      transform
      position={[0, deskY + 0.62, deskZ - 0.05]}
      rotation={[-deskTilt - 0.5, 0, 0]}
      distanceFactor={1.25}
      zIndexRange={[20, 0]}
    >
      <nav aria-label="Control room" {...stylex.props(styles.menu)}>
        {destinations.map((destination) => (
          <Channel key={destination.id} destination={destination} active={picked === destination.id} onPick={pick} />
        ))}
      </nav>
    </Html>
  )
}
