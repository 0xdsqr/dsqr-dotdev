import * as stylex from '@stylexjs/stylex'
import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Destination } from '../content/destinations'
import type { CameraApi } from './camera/camera-director'
import type { TheaterControls, TheaterMode } from './mode'
import { pill } from './overlay/pill'
import { Equalizer } from './overlay/equalizer'
import { SiteLinks } from './overlay/site-links'

const StageScene = lazy(() => import('./stage-scene'))

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(reducedMotionQuery).matches, () => false)
}

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function useTheaterKeys(recenter: () => void, leave: () => void, enter: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (event.key === 'Escape') leave()
      else if (event.key.toLowerCase() === 'r') recenter()
      else if (event.key.toLowerCase() === 'c') enter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recenter, leave, enter])
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

const styles = stylex.create({
  theater: {
    position: 'relative',
    height: stylex.firstThatWorks('100svh', '100vh'),
    minHeight: stylex.firstThatWorks('100svh', '100vh'),
    overflow: 'hidden',
    colorScheme: 'dark',
    backgroundColor: '#07050d',
    backgroundImage: 'radial-gradient(120% 80% at 50% 35%, #2a1450 0%, #0d0818 55%, #07050d 100%)',
  },
  stage: {
    position: 'absolute',
    inset: 0,
    touchAction: 'none',
  },
  corner: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
  },
  primary: {
    position: 'absolute',
    top: '0.75rem',
    left: '0.75rem',
    zIndex: 30,
  },
})

export function Theater({ onNavigate }: { onNavigate: (destination: Destination) => void }) {
  const mounted = useMounted()
  const reducedMotion = useReducedMotion()
  const camera = useRef<CameraApi | null>(null)
  const [moved, setMoved] = useState(false)
  const [mode, setMode] = useState<TheaterMode>('crowd')
  const leave = useCallback(() => setMode('crowd'), [])
  const enter = useCallback(() => setMode('booth'), [])
  const recenter = useCallback(() => {
    if (mode === 'booth') leave()
    else camera.current?.recenter()
  }, [mode, leave])
  const controls = useMemo<TheaterControls>(
    () => ({
      mode,
      enterBooth: enter,
      select: onNavigate,
    }),
    [mode, enter, onNavigate],
  )
  useTheaterKeys(recenter, leave, enter)

  return (
    <div {...stylex.props(styles.theater)}>
      <section
        aria-label="An animated theater: a packed crowd under four sweeping purple spotlights, a sound booth in the stands, speaker stacks, and a stick figure with 0xdsqr's face playing a grand piano. Drag to look around, press R to recenter, and press C or open the sound booth to navigate."
        onDoubleClick={() => mode === 'crowd' && camera.current?.recenter()}
        {...stylex.props(styles.stage)}
      >
        {mounted && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <StageScene reducedMotion={reducedMotion} camera={camera} controls={controls} onMovedChange={setMoved} />
            </Suspense>
          </SceneBoundary>
        )}
      </section>
      <SiteLinks />
      <div {...stylex.props(styles.primary)}>
        {mode === 'booth' ? (
          <button type="button" onClick={leave} {...stylex.props(pill.base)}>
            Back to crowd
            <kbd {...stylex.props(pill.key)}>Esc</kbd>
          </button>
        ) : (
          <button type="button" onClick={enter} {...stylex.props(pill.base)}>
            <Equalizer />
            Control room
            <kbd {...stylex.props(pill.key)}>C</kbd>
          </button>
        )}
      </div>
      {mode === 'crowd' && moved && (
        <div {...stylex.props(styles.corner)}>
          <button type="button" onClick={recenter} {...stylex.props(pill.base)}>
            Recenter
            <kbd {...stylex.props(pill.key)}>R</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
