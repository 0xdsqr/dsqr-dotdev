import * as stylex from '@stylexjs/stylex'
import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { CameraApi } from './camera/camera-director'

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

function useRecenterKey(recenter: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      recenter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recenter])
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
  recenter: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    paddingBlock: '0.45rem',
    paddingInline: '0.9rem',
    borderRadius: '999px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(196, 181, 253, 0.35)',
    backgroundColor: 'rgba(13, 8, 24, 0.7)',
    backdropFilter: 'blur(8px)',
    color: '#ede9fe',
    font: 'inherit',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '160ms',
    ':hover': {
      borderColor: 'rgba(196, 181, 253, 0.7)',
      backgroundColor: 'rgba(42, 20, 80, 0.75)',
    },
    ':focus-visible': {
      outline: '2px solid #c4b5fd',
      outlineOffset: '2px',
    },
  },
  key: {
    marginInlineStart: '0.5rem',
    paddingInline: '0.35rem',
    borderRadius: '0.25rem',
    backgroundColor: 'rgba(196, 181, 253, 0.16)',
    fontSize: '0.75rem',
  },
})

export function Theater() {
  const mounted = useMounted()
  const reducedMotion = useReducedMotion()
  const camera = useRef<CameraApi | null>(null)
  const [moved, setMoved] = useState(false)
  const recenter = useRef(() => camera.current?.recenter()).current
  useRecenterKey(recenter)

  return (
    <div {...stylex.props(styles.theater)}>
      <section
        aria-label="An animated theater: a packed crowd under four sweeping purple spotlights, a sound booth in the stands, speaker stacks, and a stick figure with 0xdsqr's face playing a grand piano. Drag to look around; press R to recenter."
        onDoubleClick={recenter}
        {...stylex.props(styles.stage)}
      >
        {mounted && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <StageScene reducedMotion={reducedMotion} camera={camera} onMovedChange={setMoved} />
            </Suspense>
          </SceneBoundary>
        )}
      </section>
      {moved && (
        <button type="button" onClick={recenter} {...stylex.props(styles.recenter)}>
          Recenter
          <kbd {...stylex.props(styles.key)}>R</kbd>
        </button>
      )}
    </div>
  )
}
