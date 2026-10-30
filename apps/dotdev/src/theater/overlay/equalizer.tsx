import * as stylex from '@stylexjs/stylex'
import { chrome } from './chrome.stylex'

const bounce = stylex.keyframes({
  '0%': { transform: 'scaleY(0.35)' },
  '50%': { transform: 'scaleY(1)' },
  '100%': { transform: 'scaleY(0.35)' },
})

const styles = stylex.create({
  bars: {
    display: 'inline-flex',
    alignItems: 'flex-end',
    columnGap: '2px',
    height: '0.8rem',
  },
  bar: {
    width: '3px',
    height: '100%',
    borderRadius: '1px',
    backgroundColor: chrome.violet,
    boxShadow: '0 0 8px rgba(139, 92, 246, 0.8)',
    transformOrigin: 'bottom',
    animationName: { default: bounce, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '0.625s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
})

export function Equalizer() {
  return (
    <span aria-hidden="true" {...stylex.props(styles.bars)}>
      {[0, 0.18, 0.36].map((delay) => (
        <span key={delay} style={{ animationDelay: `${delay}s` }} {...stylex.props(styles.bar)} />
      ))}
    </span>
  )
}
