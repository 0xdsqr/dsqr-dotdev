import * as stylex from '@stylexjs/stylex'
import type { ComponentProps } from 'react'
import { breakpoints, colors, motion } from '../styles/theme.stylex'

const styles = stylex.create({
  link: {
    color: {
      default: colors.ink,
      ':hover': { default: null, [breakpoints.hover]: colors.accent },
      ':focus-visible': colors.accent,
    },
    whiteSpace: 'nowrap',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
    borderRadius: '2px',
    outlineColor: colors.accent,
    transitionProperty: 'color',
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.easeColor,
  },
})

export function TextLink(props: Omit<ComponentProps<'a'>, 'className' | 'style'>) {
  return <a {...props} {...stylex.props(styles.link)} />
}
