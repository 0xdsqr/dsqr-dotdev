import { useFBO } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import { screenSize } from './screen-frame'

export type Lens = {
  readonly position: readonly [number, number, number]
  readonly target: readonly [number, number, number]
  readonly fov: number
  readonly drift: number
}

export function LiveFeed({ lens, slot, still }: { lens: Lens; slot: 0 | 1; still: boolean }) {
  const target = useFBO(640, 360, { samples: 0 })
  const { camera, focus } = useMemo(() => {
    const camera = new PerspectiveCamera(lens.fov, 16 / 9, 0.1, 60)
    camera.position.set(...lens.position)
    const focus = new Vector3(...lens.target)
    camera.lookAt(focus)
    return { camera, focus }
  }, [lens])
  const frame = useRef(0)

  useFrame(({ gl, scene, clock }) => {
    const index = frame.current++
    if (still ? index > 0 : index % 2 !== slot) return
    camera.position.x = lens.position[0] + Math.sin(clock.elapsedTime * 0.25 + slot * 2) * lens.drift
    camera.lookAt(focus)
    const previous = gl.getRenderTarget()
    gl.setRenderTarget(target)
    gl.render(scene, camera)
    gl.setRenderTarget(previous)
  })

  return (
    <mesh>
      <planeGeometry args={[screenSize.width, screenSize.height]} />
      <meshBasicMaterial map={target.texture} />
    </mesh>
  )
}
