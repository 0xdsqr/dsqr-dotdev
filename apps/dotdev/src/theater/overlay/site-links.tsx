import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { destinations } from '../../content/destinations'
import { chrome } from './chrome.stylex'

const styles = stylex.create({
  nav: {
    position: 'absolute',
    top: '3.75rem',
    left: '1rem',
    zIndex: 30,
    display: 'flex',
    columnGap: '0.25rem',
    padding: '0.3rem',
    borderRadius: '0.75rem',
    backgroundColor: chrome.glassStrong,
    clipPath: { default: 'inset(50%)', ':focus-within': 'none' },
    opacity: { default: 0, ':focus-within': 1 },
  },
  link: {
    paddingBlock: '0.4rem',
    paddingInline: '0.6rem',
    borderRadius: '0.5rem',
    color: chrome.ink,
    fontFamily: chrome.mono,
    fontSize: '0.8rem',
    textDecoration: 'none',
    outline: { ':focus-visible': `2px solid ${chrome.edgeHot}` },
  },
})

export function SiteLinks() {
  return (
    <nav aria-label="Site" {...stylex.props(styles.nav)}>
      {destinations.map((destination) => (
        <Link key={destination.id} to={destination.href} {...stylex.props(styles.link)}>
          {destination.label}
        </Link>
      ))}
    </nav>
  )
}
