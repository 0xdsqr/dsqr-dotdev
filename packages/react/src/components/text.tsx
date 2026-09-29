import * as stylex from '@stylexjs/stylex'
import type { ComponentProps } from 'react'
import { colors, layout, typography } from '../styles/theme.stylex'

const styles = stylex.create({
  text: {
    maxWidth: layout.measure,
    fontSize: typography.sizeBody,
    textWrap: 'pretty',
  },
  default: { color: colors.ink },
  muted: { color: colors.muted },
})

type TextProps = Omit<ComponentProps<'p'>, 'className' | 'style'> & {
  tone?: 'default' | 'muted'
}

// Content is ink by default; `muted` is for supporting copy. StyleX owns
// className/style, and spacing between elements belongs to the parent layout.
export function Text({ tone = 'default', ...props }: TextProps) {
  return <p {...props} {...stylex.props(styles.text, styles[tone])} />
}
