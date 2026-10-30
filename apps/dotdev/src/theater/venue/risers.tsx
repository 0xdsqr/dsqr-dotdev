import { rowHalfWidth, rowY, rowZ, rows } from '../lib/layout'
import { materials } from '../lib/materials'

export function Risers() {
  return (
    <group>
      {Array.from({ length: rows.count }, (_, row) => {
        const height = Math.max(rowY(row), 0.04)
        return (
          <mesh key={row} position={[0, height / 2, rowZ(row) + 0.1]} material={materials.riser}>
            <boxGeometry args={[rowHalfWidth(row) * 2 + 3, height, rows.spacing]} />
          </mesh>
        )
      })}
    </group>
  )
}
