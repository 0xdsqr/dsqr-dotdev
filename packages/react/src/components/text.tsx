import * as stylex from '@stylexjs/stylex'
import type { ComponentProps } from 'react'

const styles = stylex.create({
  text: {
    margin: '1rem 0 0',
    fontSize: '1rem',
    lineHeight: 1.5,
    textAlign: 'center',
  },
})

export function Text(props: ComponentProps<'p'>) {
  return <p {...props} {...stylex.props(styles.text)} />
}
