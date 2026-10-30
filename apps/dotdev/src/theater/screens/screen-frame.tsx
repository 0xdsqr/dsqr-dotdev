import type { ReactNode } from 'react'
import { materials } from '../lib/materials'

export const screenSize = { width: 4.8, height: 2.7 } as const

export function ScreenFrame({
  position,
  yaw = 0,
  pitch = 0,
  scale = 1,
  rigging = true,
  children,
}: {
  position: readonly [number, number, number]
  yaw?: number
  pitch?: number
  scale?: number
  rigging?: boolean
  children: ReactNode
}) {
  return (
    <group position={[...position]} rotation={[pitch, yaw, 0]} scale={scale}>
      <mesh position={[0, 0, -0.08]} material={materials.cabinet}>
        <boxGeometry args={[screenSize.width + 0.3, screenSize.height + 0.3, 0.14]} />
      </mesh>
      <mesh position={[0, screenSize.height / 2 + 0.16, 0]} material={materials.violet}>
        <boxGeometry args={[screenSize.width + 0.3, 0.035, 0.03]} />
      </mesh>
      {rigging &&
        [-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.6, screenSize.height / 2 + 3, -0.08]} material={materials.metal}>
          <cylinderGeometry args={[0.012, 0.012, 5.7, 6]} />
        </mesh>
      ))}
      {children}
    </group>
  )
}
