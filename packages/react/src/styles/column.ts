import * as stylex from '@stylexjs/stylex'
import { layout, space } from './theme.stylex'

export const column = stylex.create({
  base: {
    width: '100%',
    maxWidth: `calc(${layout.content} + 2 * ${space.gutter})`,
    marginInline: 'auto',
    paddingInline: space.gutter,
  },
})
