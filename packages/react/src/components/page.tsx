import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { column } from '../styles/column'
import { space } from '../styles/theme.stylex'
import { Footer } from './footer'

const styles = stylex.create({
  page: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: '1fr auto',
    minHeight: stylex.firstThatWorks('100svh', '100vh'),
  },
  main: {
    display: 'grid',
    alignContent: 'start',
    rowGap: space.xxl,
    paddingBlock: space.section,
  },
  centered: {
    alignContent: 'center',
    justifyItems: 'center',
  },
})

export function Page({
  site,
  centered = false,
  footerAction,
  children,
}: {
  site: string
  centered?: boolean
  footerAction?: ReactNode
  children: ReactNode
}) {
  return (
    <div {...stylex.props(styles.page)}>
      <main {...stylex.props(column.base, styles.main, centered && styles.centered)}>{children}</main>
      <Footer site={site} action={footerAction} />
    </div>
  )
}
