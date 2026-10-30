import { materials } from '../lib/materials'
import { Cabinet } from './cabinet'

export function LineArray({
  position,
  yaw = 0,
  boxes = 7,
  hang,
}: {
  position: readonly [number, number, number]
  yaw?: number
  boxes?: number
  hang: number
}) {
  return (
    <group position={[...position]} rotation={[0, yaw, 0]}>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, hang / 2 + 0.25, 0]} material={materials.metal}>
          <cylinderGeometry args={[0.012, 0.012, hang, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]} material={materials.metal}>
        <boxGeometry args={[1.35, 0.08, 0.5]} />
      </mesh>
      {Array.from({ length: boxes }, (_, index) => (
        <group key={index} position={[0, -index * 0.44, index * index * 0.012]} rotation={[0.04 + index * 0.05, 0, 0]}>
          <Cabinet width={1.4} height={0.4} />
        </group>
      ))}
    </group>
  )
}
