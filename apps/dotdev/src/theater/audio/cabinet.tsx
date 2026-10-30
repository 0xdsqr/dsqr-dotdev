import { materials } from '../lib/materials'

export type CabinetProps = { width?: number; height?: number; depth?: number; drivers?: number }

export function Cabinet({ width = 1.25, height = 0.36, depth = 0.72, drivers = 2 }: CabinetProps) {
  const face = depth / 2
  const radius = Math.min(height * 0.36, width / (drivers * 2.6))
  return (
    <group>
      <mesh material={materials.cabinet}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh position={[0, 0, face + 0.002]} material={materials.grille}>
        <planeGeometry args={[width - 0.07, height - 0.06]} />
      </mesh>
      {Array.from({ length: drivers }, (_, index) => {
        const x = (index - (drivers - 1) / 2) * (width / drivers)
        return (
          <group key={index} position={[x, 0, face + 0.004]} name="driver">
            <mesh material={materials.metal}>
              <torusGeometry args={[radius, radius * 0.12, 6, 24]} />
            </mesh>
            <mesh position={[0, 0, -0.001]} material={materials.rubber}>
              <circleGeometry args={[radius, 24]} />
            </mesh>
            <mesh position={[0, 0, 0.004]} scale={[1, 1, 0.4]} material={materials.metal}>
              <sphereGeometry args={[radius * 0.32, 12, 8]} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, -height / 2 + 0.012, face + 0.006]} material={materials.violet}>
        <planeGeometry args={[width - 0.07, 0.014]} />
      </mesh>
    </group>
  )
}
