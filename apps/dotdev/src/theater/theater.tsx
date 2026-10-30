import * as stylex from '@stylexjs/stylex'
import { Component, lazy, Suspense, type ReactNode, useEffect, useState, useSyncExternalStore } from 'react'

const StageScene = lazy(() => import('./stage-scene'))

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  )
}

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

const drift = stylex.keyframes({
  '0%': { transform: 'translateY(0)', opacity: 0.35 },
  '50%': { transform: 'translateY(0.35rem)', opacity: 0.8 },
  '100%': { transform: 'translateY(0)', opacity: 0.35 },
})

const styles = stylex.create({
  hero: {
    position: 'relative',
    height: stylex.firstThatWorks('100svh', '100vh'),
    minHeight: '30rem',
    overflow: 'hidden',
    colorScheme: 'dark',
    backgroundColor: '#07050d',
    backgroundImage: 'radial-gradient(120% 80% at 50% 35%, #2a1450 0%, #0d0818 55%, #07050d 100%)',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
  },
  cue: {
    position: 'absolute',
    insetInline: 0,
    bottom: '1.25rem',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  line: {
    width: '1px',
    height: '2.25rem',
    backgroundImage: 'linear-gradient(to bottom, transparent, #c4b5fd)',
    animationName: { default: drift, '@media (prefers-reduced-motion: reduce)': 'none' },
    animationDuration: '2.4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
})

export function Theater() {
  const mounted = useMounted()
  const reducedMotion = useReducedMotion()
  return (
    <section
      aria-label="An animated theater: a packed crowd under four sweeping purple spotlights, a sound booth in the stands, speaker stacks, and a stick figure with 0xdsqr's face playing a grand piano on stage."
      {...stylex.props(styles.hero)}
    >
      <div {...stylex.props(styles.canvas)} aria-hidden="true">
        {mounted && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <StageScene reducedMotion={reducedMotion} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div {...stylex.props(styles.cue)} aria-hidden="true">
        <div {...stylex.props(styles.line)} />
      </div>
    </section>
  )
}
