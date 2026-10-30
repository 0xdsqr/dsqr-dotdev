import { Billboard, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { type Group, SRGBColorSpace, type Texture } from 'three'
import portrait from '../../assets/portrait.webp'
import { bounce, sway } from '../lib/beat'

const crop = 0.66
const width = 0.64
const height = width * ((601 * crop) / 480)

export function PortraitHead() {
  const tilt = useRef<Group>(null)
  const texture = useTexture(portrait, (loaded: Texture) => {
    loaded.colorSpace = SRGBColorSpace
    loaded.repeat.set(1, crop)
    loaded.offset.set(0, 1 - crop)
  })
  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (tilt.current) tilt.current.rotation.z = sway(time * 0.45) * 0.09 + bounce(time, 0.6) * 0.03
  })
  return (
    <Billboard>
      <group ref={tilt}>
        <mesh position={[0, height / 2 - 0.05, 0.03]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.08} />
        </mesh>
      </group>
    </Billboard>
  )
}
