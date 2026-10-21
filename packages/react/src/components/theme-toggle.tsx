import * as stylex from '@stylexjs/stylex'
import { iconControl } from '../styles/control'
import { visuallyHidden } from '../styles/visually-hidden'
import { breakpoints, motion } from '../styles/theme.stylex'
import { toggleTheme } from '../theme'
import { Icon } from './icon'

const styles = stylex.create({
  glyphs: {
    display: 'grid',
  },
  glyph: {
    gridArea: '1 / 1',
    transitionProperty: 'transform, opacity',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.easeOut,
  },
  sun: {
    opacity: { default: 1, [stylex.when.ancestor('[data-theme="dark"]')]: 0 },
    transform: {
      default: 'none',
      [stylex.when.ancestor('[data-theme="dark"]')]: 'rotate(-90deg) scale(0.6)',
      [breakpoints.reducedMotion]: 'none',
    },
  },
  moon: {
    opacity: { default: 0, [stylex.when.ancestor('[data-theme="dark"]')]: 1 },
    transform: {
      default: 'rotate(90deg) scale(0.6)',
      [stylex.when.ancestor('[data-theme="dark"]')]: 'none',
      [breakpoints.reducedMotion]: 'none',
    },
  },
})

export function ThemeToggle() {
  return (
    <button type="button" onClick={toggleTheme} {...stylex.props(iconControl.base)}>
      <span aria-hidden="true" {...stylex.props(styles.glyphs)}>
        <span {...stylex.props(styles.glyph, styles.sun)}>
          <Icon name="sun" size="md" />
        </span>
        <span {...stylex.props(styles.glyph, styles.moon)}>
          <Icon name="moon" size="md" />
        </span>
      </span>
      <span {...stylex.props(visuallyHidden.base)}>Switch between light and dark theme</span>
    </button>
  )
}
