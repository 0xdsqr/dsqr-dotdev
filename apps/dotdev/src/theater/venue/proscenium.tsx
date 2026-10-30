import { stage } from '../lib/layout'
import { materials } from '../lib/materials'

export const proscenium = { headerY: 11.4, front: 1.1, stripY: 10.68 } as const

export function Proscenium() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (stage.width / 2 + 1), 5.5, 0.4]} material={materials.wall}>
            <boxGeometry args={[1.6, 11, 1.4]} />
          </mesh>
          <mesh position={[side * (stage.width / 2 + 0.18), 5.5, proscenium.front + 0.02]} material={materials.violet}>
            <boxGeometry args={[0.06, 10.6, 0.04]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, proscenium.headerY, 0.4]} material={materials.wall}>
        <boxGeometry args={[stage.width + 3.6, 1.4, 1.4]} />
      </mesh>
      <mesh position={[0, proscenium.stripY, proscenium.front + 0.02]} material={materials.violet}>
        <boxGeometry args={[stage.width + 0.42, 0.06, 0.04]} />
      </mesh>
    </group>
  )
}
