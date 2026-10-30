import { useFrame } from '@react-three/fiber'
import { type RefObject, useRef } from 'react'
import type { Group } from 'three'
import { kick } from '../beat'
import { stage } from '../layout'
import { palette } from '../palette'

const boxes = 8

function LineArray({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * (stage.width / 2 + 2.7), 9.6, 1.2]} rotation={[0, -side * 0.18, 0]}>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.1, 6]} />
          <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {Array.from({ length: boxes }, (_, index) => (
        <group key={index} position={[0, -index * 0.4, index * index * 0.012]} rotation={[0.02 + index * 0.045, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.25, 0.36, 0.72]} />
            <meshStandardMaterial color={palette.speaker} roughness={0.55} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.362]}>
            <planeGeometry args={[1.18, 0.3]} />
            <meshStandardMaterial color={palette.grille} roughness={0.9} />
          </mesh>
          <mesh position={[0.5, -0.12, 0.365]}>
            <circleGeometry args={[0.018, 8]} />
            <meshBasicMaterial color={palette.violet} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Driver({ x, y, cones }: { x: number; y: number; cones: RefObject<Set<Group>> }) {
  return (
    <group position={[x, y, 0.451]}>
      <mesh>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color={palette.grille} roughness={0.8} />
      </mesh>
      <group
        ref={(group) => {
          if (group) cones.current.add(group)
        }}
      >
        <mesh position={[0, 0, 0.01]}>
          <torusGeometry args={[0.25, 0.025, 8, 32]} />
          <meshStandardMaterial color={palette.metal} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.23, 32]} />
          <meshStandardMaterial color={palette.speaker} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

function SubStack({ x }: { x: number }) {
  const cones = useRef(new Set<Group>())
  useFrame(({ clock }) => {
    const push = kick(clock.elapsedTime) * 0.05
    for (const cone of cones.current) cone.position.z = push
  })
  return (
    <group position={[x, 0, stage.front + 0.9]}>
      {[0.43, 1.29].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[1.35, 0.84, 0.9]} />
            <meshStandardMaterial color={palette.speaker} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.36, 0.452]}>
            <planeGeometry args={[1.2, 0.025]} />
            <meshBasicMaterial color={palette.violet} toneMapped={false} />
          </mesh>
          <Driver x={-0.32} y={0} cones={cones} />
          <Driver x={0.32} y={0} cones={cones} />
        </group>
      ))}
    </group>
  )
}

export function Speakers() {
  return (
    <group>
      <LineArray side={-1} />
      <LineArray side={1} />
      <SubStack x={-7.6} />
      <SubStack x={7.6} />
    </group>
  )
}
