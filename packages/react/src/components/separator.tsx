import * as stylex from '@stylexjs/stylex'
import { colors } from '../styles/theme.stylex'

const styles = stylex.create({
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
