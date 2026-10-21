import { Mark } from '@dsqr-dotdev/react/components/mark'
import { Prose } from '@dsqr-dotdev/react/components/prose'
import { Stack } from '@dsqr-dotdev/react/components/stack'
import { TextLink } from '@dsqr-dotdev/react/components/text-link'
import { visuallyHidden } from '@dsqr-dotdev/react/visually-hidden'
import * as stylex from '@stylexjs/stylex'
import { LabsMark } from './labs-mark'

export function LabsIntro() {
  return (
    <Stack align="center" gap="sm" labelledBy="labs-title">
      <h1 id="labs-title">
        <LabsMark />
        <span {...stylex.props(visuallyHidden.base)}>DSQR Labs LLC</span>
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
