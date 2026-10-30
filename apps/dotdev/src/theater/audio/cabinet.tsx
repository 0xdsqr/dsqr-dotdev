import { materials } from '../lib/materials'

export function Cabinet({ width = 1.25, height = 0.36, depth = 0.72 }: { width?: number; height?: number; depth?: number }) {
  return (
    <group>
      <mesh material={materials.cabinet}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.002]} material={materials.grille}>
        <planeGeometry args={[width - 0.07, height - 0.06]} />
      </mesh>
      <mesh position={[width / 2 - 0.08, -height / 2 + 0.06, depth / 2 + 0.004]} material={materials.violet}>
        <circleGeometry args={[0.02, 8]} />
      </mesh>
    </group>
  )
}
