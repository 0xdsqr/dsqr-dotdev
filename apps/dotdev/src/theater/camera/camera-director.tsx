import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { type RefObject, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { PerspectiveCamera } from 'three'
import { homeShot, openingShot, type Shot } from './shots'

const { ACTION } = CameraControlsImpl

export type CameraApi = { recenter: () => void }

const idleReturnMs = 7000
const swing = 0.4

function look(controls: CameraControlsImpl, shot: Shot, animate: boolean) {
  return controls.setLookAt(...shot.position, ...shot.target, animate)
}

export function CameraDirector({
  still,
  api,
  onMovedChange,
}: {
  still: boolean
  api: RefObject<CameraApi | null>
  onMovedChange: (moved: boolean) => void
}) {
  const controls = useRef<CameraControlsImpl>(null)
  const { camera, size } = useThree()
  const portrait = size.width / size.height < 0.9
  const home = useMemo(() => homeShot(portrait), [portrait])
  const interacting = useRef(false)
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const recenter = () => {
    const instance = controls.current
    if (!instance) return
    clearTimeout(idle.current)
    void look(instance, home, !still)
    onMovedChange(false)
  }

  useImperativeHandle(api, () => ({ recenter }))

  useEffect(() => {
    const instance = controls.current
    if (!instance) return
    if (camera instanceof PerspectiveCamera) {
      camera.fov = portrait ? 52 : 40
      camera.updateProjectionMatrix()
    }
    const [x, , z] = home.position
    const [tx, , tz] = home.target
    const azimuth = Math.atan2(x - tx, z - tz)
    instance.minAzimuthAngle = azimuth - swing
    instance.maxAzimuthAngle = azimuth + swing
    instance.minPolarAngle = 1.05
    instance.maxPolarAngle = 1.38
    instance.mouseButtons.left = ACTION.ROTATE
    instance.mouseButtons.middle = ACTION.NONE
    instance.mouseButtons.right = ACTION.NONE
    instance.mouseButtons.wheel = ACTION.NONE
    instance.touches.one = ACTION.TOUCH_ROTATE
    instance.touches.two = ACTION.NONE
    instance.touches.three = ACTION.NONE
    instance.smoothTime = 0.45
    instance.draggingSmoothTime = 0.12
    if (still) {
      void look(instance, home, false)
      return
    }
    void look(instance, openingShot, false)
    instance.smoothTime = 1.4
    void look(instance, home, true).then(() => {
      instance.smoothTime = 0.45
    })
  }, [camera, home, portrait, still])

  useEffect(() => () => clearTimeout(idle.current), [])

  useFrame(({ pointer }) => {
    const instance = controls.current
    if (!instance || still || interacting.current) return
    void instance.setFocalOffset(pointer.x * 0.9, pointer.y * 0.45, 0, true)
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
        if (!still) idle.current = setTimeout(recenter, idleReturnMs)
      }}
    />
  )
}
