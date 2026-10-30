import { useMemo } from 'react'
import { stage } from '../lib/layout'
import { materials } from '../lib/materials'
import { Keys } from './keys'
import { createHands } from './performance'
import { Pianist } from './pianist'
import { caseTop, piano, pianoGeometry } from './shape'

const legs: ReadonlyArray<readonly [number, number]> = [
  [0.18, -0.6],
  [0.18, 0.6],
  [1.78, -0.45],
]

export const pianoPosition = [0.4, stage.height, -3.4] as const

export function Piano() {
  const { body, lid, plate } = useMemo(pianoGeometry, [])
  const hands = useMemo(createHands, [])
  const propZ = piano.hingeZ + 1.05 * Math.cos(piano.lidAngle)
  const propTop = caseTop + 1.05 * Math.sin(piano.lidAngle)

  return (
    <group position={[...pianoPosition]} scale={1.5}>
      <mesh geometry={body} position={[0, piano.legHeight, 0]} material={materials.lacquer} />
      <mesh geometry={plate} position={[0, caseTop + 0.017, 0]} material={materials.brass} />
      <group position={[0, caseTop + 0.02, piano.hingeZ]} rotation={[-piano.lidAngle, 0, 0]}>
        <mesh geometry={lid} material={materials.lacquer} />
      </group>
      <mesh position={[0.95, (caseTop + propTop) / 2, propZ]} material={materials.lacquer}>
        <cylinderGeometry args={[0.012, 0.012, propTop - caseTop, 8]} />
      </mesh>
      <mesh position={[-0.1, piano.keyTop - 0.035, 0]} material={materials.lacquer}>
        <boxGeometry args={[0.24, 0.03, 1.5]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[-0.1, piano.keyTop - 0.005, side * 0.725]} material={materials.lacquer}>
          <boxGeometry args={[0.24, 0.09, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0.06, piano.keyTop + 0.14, 0]} rotation={[0, 0, 0.12]} material={materials.lacquer}>
        <boxGeometry args={[0.02, 0.22, 1.1]} />
      </mesh>
      <Keys hands={hands} />
      {legs.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, piano.legHeight / 2, z]} material={materials.lacquer}>
          <cylinderGeometry args={[0.05, 0.035, piano.legHeight, 12]} />
        </mesh>
      ))}
      <mesh position={[0.25, 0.25, 0]} material={materials.lacquer}>
        <boxGeometry args={[0.08, 0.5, 0.18]} />
      </mesh>
      <mesh position={[-0.8, 0.26, 0]} material={materials.lacquer}>
        <boxGeometry args={[0.36, 0.52, 0.85]} />
      </mesh>
      <Pianist hands={hands} />
    </group>
  )
}
