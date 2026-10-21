import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'
import { themeScript } from '../theme'

const styles = stylex.create({
  html: {
    backgroundColor: colors.ground,
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
    fontSynthesis: 'none',
  },
})

export function Document({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning {...stylex.props(stylex.defaultMarker(), styles.html)}>
      <head>
        <meta name="theme-color" content="#fdfdfd" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {head}
      </head>
      <body {...stylex.props(styles.body)}>{children}</body>
    </html>
  )
}
