import { Mark } from '@dsqr-dotdev/react/components/mark'
import { Prose } from '@dsqr-dotdev/react/components/prose'
import { Stack } from '@dsqr-dotdev/react/components/stack'
import { TextLink } from '@dsqr-dotdev/react/components/text-link'
import { colors, typography } from '@dsqr-dotdev/react/theme.stylex'
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  // The studio's name, set in the same mono voice as the paragraph: ink and a
  // step heavier, so it reads as a signature rather than a banner.
  name: {
    color: colors.ink,
    fontFamily: typography.mono,
    fontSize: typography.sizeProse,
    fontWeight: typography.weightMedium,
    lineHeight: typography.leadingProse,
  },
})

export function LabsIntro() {
  return (
    <Stack align="center" gap="sm" labelledBy="labs-title">
      <h1 id="labs-title" {...stylex.props(styles.name)}>
        DSQR Labs LLC
      </h1>
      <Prose>
        A one-person consulting studio focused on{' '}
        <Mark>systems, infrastructure, performance, and backend engineering</Mark>. The goal is
        simple: help people ship software that stays{' '}
        <Mark>understandable, operable, and boring in the best way</Mark>. Want to work together?{' '}
        <TextLink href="mailto:me@dsqr.dev">me@dsqr.dev</TextLink>
      </Prose>
    </Stack>
  )
}
