import { Separator } from '@dsqr-dotdev/react/components/separator'
import { space } from '@dsqr-dotdev/react/theme.stylex'
import { visuallyHidden } from '@dsqr-dotdev/react/visually-hidden'
import * as stylex from '@stylexjs/stylex'
import {
  Component,
  type KeyboardEvent,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { RouteTextLink } from '../components/route-link'
import { type Destination, destinations } from '../content/destinations'
import type { CameraApi } from './camera/camera-director'
import { backdrops, chrome } from './chrome.stylex'
import type { TheaterControls, TheaterMode } from './mode'
import { Equalizer } from './overlay/equalizer'
import { pill } from './overlay/pill'
import { SiteLinks } from './overlay/site-links'

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

/** `pending` until mounted, then whether this browser can create a WebGL context at all. */
type SceneState = 'pending' | 'ready' | 'unavailable'

function canRenderWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch() {
    this.props.onError()
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
    backgroundColor: chrome.night,
    backgroundImage: backdrops.stage,
  },
  playbillMode: {
    height: 'auto',
    overflow: 'visible',
    display: 'grid',
    placeItems: 'center',
    paddingBlock: space.section,
    paddingInline: space.gutter,
  },
  stage: {
    position: 'absolute',
    inset: 0,
    touchAction: 'none',
    outline: 'none',
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
  playbill: {
    display: 'grid',
    justifyItems: 'center',
    rowGap: space.xl,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    columnGap: space.sm,
  },
})

/** Shown when the scene can't run: the same intro and destinations, as plain content. */
function Playbill({ intro }: { intro: ReactNode }) {
  return (
    <div {...stylex.props(styles.playbill)}>
      {intro}
      <nav aria-label="Site">
        <div {...stylex.props(styles.links)}>
          {destinations.map((destination, index) => (
            <span key={destination.id} {...stylex.props(styles.links)}>
              {index > 0 && <Separator />}
              <RouteTextLink to={destination.href}>{destination.label}</RouteTextLink>
            </span>
          ))}
        </div>
      </nav>
    </div>
  )
}

export function Theater({ intro, onNavigate }: { intro: ReactNode; onNavigate: (destination: Destination) => void }) {
  const reducedMotion = useReducedMotion()
  const [scene, setScene] = useState<SceneState>('pending')
  const camera = useRef<CameraApi | null>(null)
  const stage = useRef<HTMLElement>(null)
  const controlRoom = useRef<HTMLButtonElement>(null)
  const description = useId()
  const [moved, setMoved] = useState(false)
  const [mode, setMode] = useState<TheaterMode>('crowd')
  const leave = useCallback(() => setMode('crowd'), [])
  const enter = useCallback(() => setMode('booth'), [])
  const unavailable = useCallback(() => setScene('unavailable'), [])
  const recenter = useCallback(() => {
    if (mode === 'booth') leave()
    else camera.current?.recenter()
  }, [mode, leave])
  const controls = useMemo<TheaterControls>(
    () => ({ mode, enterBooth: enter, select: onNavigate }),
    [mode, enter, onNavigate],
  )

  useEffect(() => setScene(canRenderWebGL() ? 'ready' : 'unavailable'), [])

  // Escape isn't a character key, so it can stay page-wide (WCAG 2.1.4).
  useEffect(() => {
    if (mode !== 'booth') return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, leave])

  // Leaving the booth removes the focused channel; hand focus back to the button that opened it.
  const previousMode = useRef(mode)
  useEffect(() => {
    const wasBooth = previousMode.current === 'booth'
    previousMode.current = mode
    if (!wasBooth || mode !== 'crowd') return
    const active = document.activeElement
    if (!active || active === document.body || stage.current?.contains(active)) {
      controlRoom.current?.focus({ preventScroll: true })
    }
  }, [mode])

  // Single-letter shortcuts only fire while the theater has focus, never page-wide.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
    const key = event.key.toLowerCase()
    if (key === 'r') recenter()
    else if (key === 'c') enter()
  }

  if (scene === 'unavailable') {
    return (
      <div {...stylex.props(styles.theater, styles.playbillMode)}>
        <Playbill intro={intro} />
      </div>
    )
  }

  return (
    // Delegates shortcut keys from whatever inside the theater has focus (the stage or its buttons).
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div onKeyDown={onKeyDown} {...stylex.props(styles.theater)}>
      <div {...stylex.props(visuallyHidden.base)}>{intro}</div>
      {/* Pointer conveniences only; the buttons below offer the same actions by keyboard. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <section
        ref={stage}
        aria-label="Theater"
        aria-describedby={description}
        tabIndex={-1}
        onPointerDown={() => stage.current?.focus({ preventScroll: true })}
        onDoubleClick={() => mode === 'crowd' && camera.current?.recenter()}
        {...stylex.props(styles.stage)}
      >
        <p id={description} {...stylex.props(visuallyHidden.base)}>
          An animated concert: a crowd under sweeping purple spotlights, and a stick figure with 0xdsqr's face playing a
          grand piano. Drag to look around. Open the control room to choose a page.
        </p>
        {scene === 'ready' && (
          <SceneBoundary onError={unavailable}>
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
          <button ref={controlRoom} type="button" aria-keyshortcuts="C" onClick={enter} {...stylex.props(pill.base)}>
            <Equalizer />
            Control room
            <kbd {...stylex.props(pill.key)}>C</kbd>
          </button>
        )}
      </div>
      {mode === 'crowd' && moved && (
        <div {...stylex.props(styles.corner)}>
          <button type="button" aria-keyshortcuts="R" onClick={recenter} {...stylex.props(pill.base)}>
            Recenter
            <kbd {...stylex.props(pill.key)}>R</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
