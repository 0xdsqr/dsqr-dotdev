import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { type RefObject, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { PerspectiveCamera } from 'three'
import type { TheaterMode } from '../mode'
import { boothShot, homeShot, openingShot, type Shot } from './shots'

const { ACTION } = CameraControlsImpl

export type CameraApi = { recenter: () => void }

const idleReturnMs = 7000
const swing = 0.4

function look(controls: CameraControlsImpl, shot: Shot, animate: boolean) {
  return controls.setLookAt(...shot.position, ...shot.target, animate)
}

function configure(controls: CameraControlsImpl, home: Shot) {
  const [x, , z] = home.position
  const [tx, , tz] = home.target
  const azimuth = Math.atan2(x - tx, z - tz)
  controls.minAzimuthAngle = azimuth - swing
  controls.maxAzimuthAngle = azimuth + swing
  controls.minPolarAngle = 1.05
  controls.maxPolarAngle = 1.38
  controls.mouseButtons.left = ACTION.ROTATE
  controls.mouseButtons.middle = ACTION.NONE
  controls.mouseButtons.right = ACTION.NONE
  controls.mouseButtons.wheel = ACTION.NONE
  controls.touches.one = ACTION.TOUCH_ROTATE
  controls.touches.two = ACTION.NONE
  controls.touches.three = ACTION.NONE
  controls.draggingSmoothTime = 0.12
}

function free(controls: CameraControlsImpl) {
  controls.minAzimuthAngle = -Infinity
  controls.maxAzimuthAngle = Infinity
  controls.minPolarAngle = 0
  controls.maxPolarAngle = Math.PI
}

export function CameraDirector({
  still,
  mode,
  api,
  onMovedChange,
}: {
  still: boolean
  mode: TheaterMode
  api: RefObject<CameraApi | null>
  onMovedChange: (moved: boolean) => void
}) {
  const controls = useRef<CameraControlsImpl>(null)
  const { camera, size } = useThree()
  const portrait = size.width / size.height < 0.9
  const home = useMemo(() => homeShot(portrait), [portrait])
  const interacting = useRef(false)
  const opened = useRef(false)
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const recenter = () => {
    const instance = controls.current
    if (!instance || mode !== 'crowd') return
    clearTimeout(idle.current)
    void look(instance, home, !still)
    onMovedChange(false)
  }

  useImperativeHandle(api, () => ({ recenter }))

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = portrait ? 52 : 40
      camera.updateProjectionMatrix()
    }
  }, [camera, portrait])

  useEffect(() => {
    const instance = controls.current
    if (!instance) return
    clearTimeout(idle.current)
    if (mode === 'booth') {
      instance.enabled = false
      free(instance)
      instance.smoothTime = 0.9
      void look(instance, boothShot, !still)
      onMovedChange(false)
      return
    }
    instance.enabled = true
    if (!opened.current && !still) {
      opened.current = true
      void look(instance, openingShot, false)
      instance.smoothTime = 1.4
    } else {
      instance.smoothTime = 0.8
    }
    void look(instance, home, !still).then(() => {
      configure(instance, home)
      instance.smoothTime = 0.45
    })
    if (still) configure(instance, home)
  }, [home, mode, still, onMovedChange])

  useEffect(() => () => clearTimeout(idle.current), [])

  useFrame(({ pointer }) => {
    const instance = controls.current
    if (!instance || still || interacting.current) return
    const strength = mode === 'booth' ? 0.25 : 1
    void instance.setFocalOffset(pointer.x * 0.9 * strength, pointer.y * 0.45 * strength, 0, true)
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      onControlStart={() => {
        interacting.current = true
        clearTimeout(idle.current)
        onMovedChange(true)
      }}
      onControlEnd={() => {
        interacting.current = false
        clearTimeout(idle.current)
        if (!still && mode === 'crowd') idle.current = setTimeout(recenter, idleReturnMs)
      }}
    />
  )
}
