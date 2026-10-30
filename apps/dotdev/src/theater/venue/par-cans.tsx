import { stage } from '../lib/layout'
import { materials } from '../lib/materials'

const count = 10

export function ParCans({ z, y }: { z: number; y: number }) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const x = -stage.width / 2 + 0.6 + index * ((stage.width - 1.2) / (count - 1))
        return (
          <group key={index} position={[x, y, z]} rotation={[0.5, 0, 0]}>
            <mesh material={materials.metal}>
              <cylinderGeometry args={[0.13, 0.16, 0.32, 12]} />
            </mesh>
            <mesh
              position={[0, -0.165, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={index % 2 ? materials.lilac : materials.orchid}
            >
              <circleGeometry args={[0.12, 16]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
