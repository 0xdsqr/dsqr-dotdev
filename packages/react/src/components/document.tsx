import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors, typography } from '../styles/theme.stylex'
import { THEME_COLOR_ID, themeScript } from '../theme'

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

export function Document({ head, nonce, children }: { head: ReactNode; nonce?: string; children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning {...stylex.props(stylex.defaultMarker(), styles.html)}>
      <head>
        {head}
        {/* After `head`: a page's own fixed theme-color comes first, and browsers use the first. */}
        <meta id={THEME_COLOR_ID} name="theme-color" content="#fdfdfd" />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body {...stylex.props(styles.body)}>{children}</body>
    </html>
  )
}
