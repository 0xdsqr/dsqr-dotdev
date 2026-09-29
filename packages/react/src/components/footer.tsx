import * as stylex from '@stylexjs/stylex'
import { column } from '../styles/column'
import { iconControl } from '../styles/control'
import { visuallyHidden } from '../styles/visually-hidden'
import { breakpoints, colors, controls, space, typography } from '../styles/theme.stylex'
import { Icon, type IconName } from './icon'
import { Separator } from './separator'
import { ThemeToggle } from './theme-toggle'

// Half a target minus half a glyph: trimming it lets the glyphs, not their hit
// areas, sit on the content edges and set the footer's rhythm.
const TRIM = `calc((${controls.target} - ${controls.iconMd}) / -2)`
const TRIM_TOUCH = `calc((${controls.targetTouch} - ${controls.iconMd}) / -2)`

// `rel="me"` lets profile sites verify these accounts belong to this domain.
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
    display: 'flex',
    // Desktop: copyright left, links right, on one line. Phones: the links lead
    // and the copyright sits beneath, both centered under the page.
    flexDirection: { default: 'row', [breakpoints.narrow]: 'column-reverse' },
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: space.lg,
    rowGap: space.md,
    paddingTop: space.lg,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    color: colors.muted,
    fontSize: typography.sizeSmall,
    letterSpacing: typography.trackingSmall,
  },
  // The social links and the theme toggle share one row; a quiet separator
  // sets the toggle apart as a preference rather than a destination.
  actions: {
    display: 'flex',
    alignItems: 'center',
    columnGap: space.xs,
    margin: { default: TRIM, [breakpoints.coarse]: TRIM_TOUCH },
  },
  links: {
    display: 'flex',
  },
})

export function Footer({ site }: { site: string }) {
  return (
    <footer {...stylex.props(column.base, styles.footer)}>
      <div {...stylex.props(styles.inner)}>
        {/* Server (UTC) and browser (local) can disagree on the year at midnight. */}
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} {site}
        </p>
        <div {...stylex.props(styles.actions)}>
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
      </div>
    </footer>
  )
}
