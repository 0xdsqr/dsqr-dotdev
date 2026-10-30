import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { column } from '../styles/column'
import { iconControl } from '../styles/control'
import { visuallyHidden } from '../styles/visually-hidden'
import { breakpoints, colors, controls, space, typography } from '../styles/theme.stylex'
import { Icon, type IconName } from './icon'
import { Separator } from './separator'
import { ThemeToggle } from './theme-toggle'

const TRIM = `calc((${controls.target} - ${controls.iconMd}) / -2)`
const TRIM_TOUCH = `calc((${controls.targetTouch} - ${controls.iconMd}) / -2)`

const links: ReadonlyArray<{ label: string; href: string; icon: IconName; profile?: boolean }> = [
  { label: 'GitHub', href: 'https://github.com/0xdsqr', icon: 'github', profile: true },
  { label: 'GitLab', href: 'https://gitlab.com/dave_is_stable', icon: 'gitlab', profile: true },
  { label: 'X', href: 'https://x.com/0xdsqr', icon: 'x', profile: true },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/davedennis93', icon: 'linkedin', profile: true },
  { label: 'Email', href: 'mailto:me@dsqr.dev', icon: 'mail' },
  { label: 'RSS feed', href: 'https://dsqr.dev/rss.xml', icon: 'rss' },
]

const styles = stylex.create({
  footer: {
    paddingBottom: space.lg,
  },
  inner: {
    display: 'grid',
    justifyItems: 'center',
    rowGap: space.md,
    paddingTop: space.lg,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    color: colors.muted,
    fontSize: typography.sizeSmall,
    letterSpacing: typography.trackingSmall,
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    columnGap: space.xs,
    margin: { default: TRIM, [breakpoints.coarse]: TRIM_TOUCH },
  },
  links: {
    display: 'flex',
  },
  action: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  plain: {
    borderTopWidth: 0,
  },
  signoff: {
    fontFamily: typography.mono,
    fontSize: typography.sizeCaption,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  },
})

export function Footer({ site, action, divider = true }: { site: string; action?: ReactNode; divider?: boolean }) {
  return (
    <footer {...stylex.props(column.base, styles.footer)}>
      <div {...stylex.props(styles.inner, !divider && styles.plain)}>
        <div {...stylex.props(styles.controls)}>
          <nav aria-label="Social links" {...stylex.props(styles.links)}>
            {links.map(({ label, href, icon, profile }) => (
              <a key={label} href={href} rel={profile ? 'me' : undefined} {...stylex.props(iconControl.base)}>
                <Icon name={icon} size="md" />
                <span {...stylex.props(visuallyHidden.base)}>{label}</span>
              </a>
            ))}
          </nav>
          <Separator />
          <ThemeToggle />
        </div>
        {action != null && <div {...stylex.props(styles.action)}>{action}</div>}
        <p suppressHydrationWarning {...stylex.props(styles.signoff)}>
          © {new Date().getFullYear()} {site}
        </p>
      </div>
    </footer>
  )
}
