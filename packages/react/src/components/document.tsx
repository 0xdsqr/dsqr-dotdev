import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'
import { themeScript } from '../theme'

const styles = stylex.create({
  html: {
    // Overscroll and the scrollbar track match the page in both schemes.
    backgroundColor: colors.ground,
    // Reserve the scrollbar so layout never shifts between short and long pages.
    scrollbarGutter: 'stable',
  },
  body: {
    backgroundColor: colors.ground,
    color: colors.ink,
    fontFamily: typography.sans,
    fontSize: typography.sizeBody,
    fontWeight: typography.weightBody,
    lineHeight: typography.leadingBody,
    letterSpacing: typography.trackingBody,
    // Only real Geist weights render; the browser never fakes bold or italics.
    fontSynthesis: 'none',
  },
})

export function Document({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    // The theme script sets data-theme before hydration, so React does not own
    // that attribute. The default marker lets components style against it.
    <html lang="en" suppressHydrationWarning {...stylex.props(stylex.defaultMarker(), styles.html)}>
      <head>
        {/* Browser chrome matches the ground token; the theme script keeps it in sync. */}
        <meta name="theme-color" content="#fdfdfd" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {head}
      </head>
      <body {...stylex.props(styles.body)}>{children}</body>
    </html>
  )
}
