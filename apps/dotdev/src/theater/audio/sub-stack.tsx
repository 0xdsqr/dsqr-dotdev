import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { kick } from '../lib/beat'
import { stage } from '../lib/layout'
import { materials } from '../lib/materials'

function Driver({ x, register }: { x: number; register: (cone: Group | null) => void }) {
  return (
    <group position={[x, 0, 0.451]}>
      <mesh material={materials.grille}>
        <circleGeometry args={[0.3, 32]} />
      </mesh>
      <group ref={register}>
        <mesh position={[0, 0, 0.01]} material={materials.metal}>
          <torusGeometry args={[0.25, 0.025, 8, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} material={materials.rubber}>
          <circleGeometry args={[0.23, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.5]} material={materials.metal}>
          <sphereGeometry args={[0.07, 16, 12]} />
        </mesh>
      </group>
    </group>
  )
}

export function SubStack({ x }: { x: number }) {
  const cones = useRef(new Set<Group>())
  const register = (cone: Group | null) => {
    if (cone) cones.current.add(cone)
  }
  useFrame(({ clock }) => {
    const push = kick(clock.elapsedTime) * 0.05
    for (const cone of cones.current) cone.position.z = push
  })
  return (
    <group position={[x, 0, stage.front + 0.9]}>
      {[0.43, 1.29].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh material={materials.cabinet}>
            <boxGeometry args={[1.35, 0.84, 0.9]} />
          </mesh>
          <mesh position={[0, -0.36, 0.452]} material={materials.violet}>
            <planeGeometry args={[1.2, 0.025]} />
          </mesh>
          <Driver x={-0.32} register={register} />
          <Driver x={0.32} register={register} />
        </group>
      ))}
    </group>
  )
}
