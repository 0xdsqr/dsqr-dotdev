import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'

export const openingShot = [0, 19, 46] as const

export function CameraRig({ still }: { still: boolean }) {
  const { camera, size } = useThree()
  const portrait = size.width / size.height < 0.9
  const { base, focus, target } = useMemo(
    () => ({
      base: portrait ? new Vector3(0.8, 9.8, 23) : new Vector3(4.5, 11, 27),
      focus: portrait ? new Vector3(0.4, 2.1, -3.2) : new Vector3(0.3, 2.2, -1.8),
      target: new Vector3(),
    }),
    [portrait],
  )

  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = portrait ? 52 : 40
      camera.updateProjectionMatrix()
    }
    if (still) {
      camera.position.copy(base)
      camera.lookAt(focus)
    }
  }, [camera, portrait, still, base, focus])

  useFrame(({ clock, pointer }, delta) => {
    if (still) return
    const time = clock.elapsedTime
    target.set(
      base.x + pointer.x * 3 + Math.sin(time * 0.08) * (portrait ? 0.8 : 2.5),
      base.y + pointer.y * 1.4 + Math.sin(time * 0.11) * 0.4,
      base.z + Math.cos(time * 0.08) * 1.2,
    )
    camera.position.lerp(target, 1 - Math.exp(-delta * (time < 4 ? 0.9 : 1.6)))
    camera.lookAt(focus)
  })
  return null
}
