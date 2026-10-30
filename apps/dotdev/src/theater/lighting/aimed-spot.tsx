import { useMemo } from 'react'
import { Object3D } from 'three'

export type AimedSpotProps = {
  position: readonly [number, number, number]
  target: readonly [number, number, number]
  color: string
  intensity: number
  angle: number
  distance: number
  penumbra?: number
  decay?: number
}

export function AimedSpot({ position, target, color, intensity, angle, distance, penumbra = 0.8, decay = 1.5 }: AimedSpotProps) {
  const aim = useMemo(() => new Object3D(), [])
  return (
    <group>
      <primitive object={aim} position={[...target]} />
      <spotLight
        position={[...position]}
        target={aim}
        color={color}
        intensity={intensity}
        angle={angle}
        distance={distance}
        penumbra={penumbra}
        decay={decay}
      />
    </group>
  )
}
