import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { column } from '../styles/column'
import { space } from '../styles/theme.stylex'
import { Footer } from './footer'

const styles = stylex.create({
  // Content grows; the footer rests at the bottom on short pages. The small
  // viewport unit keeps it still while mobile browser bars show and hide.
  page: {
    display: 'grid',
    gridTemplateRows: '1fr auto',
    minHeight: stylex.firstThatWorks('100svh', '100vh'),
  },
  main: {
    display: 'grid',
    alignContent: 'start',
    rowGap: space.xxl,
    paddingBlock: space.section,
  },
  // A single focal block (like the home intro) sits in the middle of the
  // viewport above the footer.
  centered: {
    alignContent: 'center',
    justifyItems: 'center',
  },
})

export function Page({
  site,
  centered = false,
  children,
}: {
  site: string
  centered?: boolean
  children: ReactNode
}) {
  return (
    <div {...stylex.props(styles.page)}>
      <main {...stylex.props(column.base, styles.main, centered && styles.centered)}>{children}</main>
      <Footer site={site} />
    </div>
  )
}
