import { materials } from '../lib/materials'

export function Truss({ z, width, y = 9.4 }: { z: number; width: number; y?: number }) {
  return (
    <group position={[0, y, z]}>
      {[-0.22, 0.22].map((height) =>
        [-0.22, 0.22].map((offset) => (
          <mesh key={`${height}-${offset}`} position={[0, height, offset]} material={materials.metal}>
            <boxGeometry args={[width, 0.06, 0.06]} />
          </mesh>
        )),
      )}
      {Array.from({ length: Math.floor(width / 0.9) }, (_, index) => (
        <mesh
          key={index}
          position={[-width / 2 + 0.45 + index * 0.9, 0, 0]}
          rotation={[0, 0, Math.PI / 4]}
          material={materials.metal}
        >
          <boxGeometry args={[0.04, 0.62, 0.04]} />
        </mesh>
      ))}
    </group>
  )
}
