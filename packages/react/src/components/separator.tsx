import * as stylex from '@stylexjs/stylex'
import { colors } from '../styles/theme.stylex'

const styles = stylex.create({
  // A quiet dot between items in a row: half-strength muted grey, so it reads
  // as a pause rather than content. Decorative, so screen readers skip it.
  dot: {
    display: 'inline-block',
    flexShrink: 0,
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    backgroundColor: `color-mix(in oklch, ${colors.muted} 50%, transparent)`,
    verticalAlign: 'middle',
  },
})

export function Separator() {
  return <span aria-hidden="true" {...stylex.props(styles.dot)} />
}
