import { firstIssueMessage, SubscribeRequest } from '@dsqr-dotdev/api'
import { DotdevClient } from '@dsqr-dotdev/api/client'
import { Button } from '@dsqr-dotdev/react/components/button'
import { FieldGroup } from '@dsqr-dotdev/react/components/field-group'
import { Input } from '@dsqr-dotdev/react/components/input'
import { breakpoints, colors, controls, motion, space, typography } from '@dsqr-dotdev/react/theme.stylex'
import { visuallyHidden } from '@dsqr-dotdev/react/visually-hidden'
import { useAtom } from '@effect/atom-react'
import * as stylex from '@stylexjs/stylex'
import { Option, Result, Schema } from 'effect'
import * as AsyncResult from 'effect/unstable/reactivity/AsyncResult'
import { type FormEvent, useEffect, useState } from 'react'

const subscribeAtom = DotdevClient.mutation('subscriptions', 'subscribe')
const decodeRequest = Schema.decodeUnknownResult(SubscribeRequest)

const fallback = "Couldn't subscribe right now. Try again soon."

const appear = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })

const styles = stylex.create({
  subscribe: {
    width: 'min(100%, 18rem)',
  },
  appear: {
    animationName: appear,
    animationDuration: motion.base,
    animationTimingFunction: motion.easeOut,
  },
  done: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: { default: controls.target, [breakpoints.coarse]: controls.targetTouch },
    paddingInline: space.sm,
    color: colors.ink,
  },
  problem: {
    marginTop: '0.375rem',
    color: colors.ink,
    fontSize: typography.sizeCaption,
    textAlign: 'center',
  },
})

export function Subscribe() {
  const [result, subscribe] = useAtom(subscribeAtom)
  const [email, setEmail] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const pending = AsyncResult.isWaiting(result)

  useEffect(() => {
    if (!AsyncResult.isFailure(result)) return
    const error = Option.getOrUndefined(AsyncResult.error(result))
    setProblem(error?._tag === 'RateLimited' ? 'Too many tries. Wait a few minutes and try again.' : fallback)
  }, [result])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return setProblem('Enter your email to subscribe.')
    const parsed = decodeRequest({ email })
    if (Result.isFailure(parsed)) return setProblem(firstIssueMessage(parsed.failure) ?? fallback)
    setProblem(null)
    subscribe({ payload: parsed.success })
  }

  if (AsyncResult.isSuccess(result)) {
    return (
      <div {...stylex.props(styles.subscribe)}>
        <FieldGroup>
          <p role="status" {...stylex.props(styles.done, styles.appear)}>
            You're on the list.
          </p>
        </FieldGroup>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit} {...stylex.props(styles.subscribe)}>
      <label htmlFor="subscribe-email" {...stylex.props(visuallyHidden.base)}>
        Email address for new posts
      </label>
      <FieldGroup invalid={problem !== null}>
        <Input
          variant="bare"
          id="subscribe-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="you@example.com"
          maxLength={254}
          value={email}
          invalid={problem !== null}
          aria-describedby={problem ? 'subscribe-problem' : undefined}
          onChange={(event) => {
            setEmail(event.target.value)
            if (problem) setProblem(null)
          }}
        />
        <Button variant="quiet" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Subscribe'}
        </Button>
      </FieldGroup>
      {problem && (
        <p id="subscribe-problem" role="alert" {...stylex.props(styles.problem, styles.appear)}>
          {problem}
        </p>
      )}
    </form>
  )
}
