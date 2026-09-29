import * as stylex from '@stylexjs/stylex'
import { layout, space } from './theme.stylex'

// The one content column every shared region aligns to: centered, capped at the
// reading measure, with fluid gutters that never let text touch the viewport.
export const column = stylex.create({
  base: {
    width: '100%',
    maxWidth: `calc(${layout.content} + 2 * ${space.gutter})`,
    marginInline: 'auto',
    paddingInline: space.gutter,
  },
})
