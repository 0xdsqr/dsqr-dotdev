import * as stylex from '@stylexjs/stylex'
import { useId, useState } from 'react'
import { destinations } from '../content/destinations'

const styles = stylex.create({
  root: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 30,
  },
  toggle: {
    paddingBlock: '0.45rem',
    paddingInline: '0.9rem',
    borderRadius: '999px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(196, 181, 253, 0.35)',
    backgroundColor: 'rgba(13, 8, 24, 0.7)',
    backdropFilter: 'blur(8px)',
    color: '#ede9fe',
    font: 'inherit',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    ':hover': { borderColor: 'rgba(196, 181, 253, 0.7)' },
    ':focus-visible': { outline: '2px solid #c4b5fd', outlineOffset: '2px' },
  },
  panel: {
    display: 'grid',
    rowGap: '0.15rem',
    marginTop: '0.5rem',
    minWidth: '13rem',
    padding: '0.5rem',
    borderRadius: '0.8rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(196, 181, 253, 0.25)',
    backgroundColor: 'rgba(13, 8, 24, 0.88)',
    backdropFilter: 'blur(10px)',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: '1rem',
    paddingBlock: '0.5rem',
    paddingInline: '0.65rem',
    borderRadius: '0.5rem',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '#ede9fe',
    font: 'inherit',
    fontSize: '0.875rem',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': { backgroundColor: 'rgba(139, 92, 246, 0.18)' },
    ':focus-visible': { outline: '2px solid #c4b5fd', outlineOffset: '-2px' },
  },
  closed: { display: 'none' },
  hint: { color: '#a79bd0', fontSize: '0.75rem' },
  divider: { height: '1px', marginBlock: '0.25rem', backgroundColor: 'rgba(196, 181, 253, 0.15)' },
})

export function SiteMenu({ onEnterBooth }: { onEnterBooth: () => void }) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  return (
    <div {...stylex.props(styles.root)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((value) => !value)}
        {...stylex.props(styles.toggle)}
      >
        Menu
      </button>
      <nav id={panel} aria-label="Site" {...stylex.props(styles.panel, !open && styles.closed)}>
        {destinations.map((destination) => (
          <a key={destination.id} href={destination.href} {...stylex.props(styles.item)}>
            {destination.label}
            <span {...stylex.props(styles.hint)}>{destination.hint}</span>
          </a>
        ))}
        <div {...stylex.props(styles.divider)} />
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onEnterBooth()
          }}
          {...stylex.props(styles.item)}
        >
          Enter the control room
        </button>
      </nav>
    </div>
  )
}
