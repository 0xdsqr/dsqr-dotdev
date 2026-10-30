import { useMemo } from 'react'
import { PlaneGeometry } from 'three'
import { rowHalfWidth, rowY, rowZ, rows, stage } from '../layout'
import { palette } from '../palette'

function useCurtainGeometry() {
  return useMemo(() => {
    const geometry = new PlaneGeometry(stage.width + 4, 10, 180, 1)
    const position = geometry.attributes.position
    if (position) {
      for (let index = 0; index < position.count; index++) {
        const x = position.getX(index)
        position.setZ(index, Math.sin(x * 2.4) * 0.16 + Math.sin(x * 0.7) * 0.08)
      }
    }
    geometry.computeVertexNormals()
    return geometry
  }, [])
}

function Risers() {
  return (
    <group>
      {Array.from({ length: rows.count }, (_, row) => {
        const height = Math.max(rowY(row), 0.04)
        const width = rowHalfWidth(row) * 2 + 3
        return (
          <mesh key={row} position={[0, height / 2, rowZ(row) + 0.1]}>
            <boxGeometry args={[width, height, rows.spacing]} />
            <meshStandardMaterial color={palette.riser} roughness={0.95} />
          </mesh>
        )
      })}
    </group>
  )
}

function Truss({ z, width }: { z: number; width: number }) {
  return (
    <group position={[0, 9.4, z]}>
      {[-0.22, 0.22].map((y) =>
        [-0.22, 0.22].map((offset) => (
          <mesh key={`${y}-${offset}`} position={[0, y, offset]}>
            <boxGeometry args={[width, 0.06, 0.06]} />
            <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.35} />
          </mesh>
        )),
      )}
      {Array.from({ length: Math.floor(width / 0.9) }, (_, index) => (
        <mesh key={index} position={[-width / 2 + 0.45 + index * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.04, 0.62, 0.04]} />
          <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

export function Hall() {
  const curtain = useCurtainGeometry()
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]}>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color={palette.floor} roughness={0.9} />
      </mesh>
      <mesh position={[0, stage.height / 2, -stage.depth / 2]}>
        <boxGeometry args={[stage.width, stage.height, stage.depth]} />
        <meshStandardMaterial color={palette.stage} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, stage.height - 0.02, stage.front + 0.03]}>
        <boxGeometry args={[stage.width, 0.04, 0.04]} />
        <meshBasicMaterial color={palette.violet} toneMapped={false} />
      </mesh>
      <mesh geometry={curtain} position={[0, stage.height + 5, -stage.depth + 0.4]}>
        <meshPhysicalMaterial color={palette.velvet} roughness={0.85} sheen={1} sheenRoughness={0.4} sheenColor={palette.orchid} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (stage.width / 2 + 1), 5.5, 0.4]}>
          <boxGeometry args={[1.6, 11, 1.4]} />
          <meshStandardMaterial color={palette.wall} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 11.4, 0.4]}>
        <boxGeometry args={[stage.width + 3.6, 1.4, 1.4]} />
        <meshStandardMaterial color={palette.wall} roughness={0.8} />
      </mesh>
      <mesh position={[0, 9, -11]}>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial color={palette.wall} roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 24, 9, 10]} rotation={[0, -side * (Math.PI / 2), 0]}>
          <planeGeometry args={[50, 20]} />
          <meshStandardMaterial color={palette.wall} roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`strip-${side}`} position={[side * (stage.width / 2 + 0.18), 5.5, 1.12]}>
          <boxGeometry args={[0.06, 10.6, 0.04]} />
          <meshBasicMaterial color={palette.violet} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 10.68, 1.12]}>
        <boxGeometry args={[stage.width + 0.42, 0.06, 0.04]} />
        <meshBasicMaterial color={palette.violet} toneMapped={false} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => {
        const x = -stage.width / 2 + 0.6 + index * ((stage.width - 1.2) / 9)
        return (
          <group key={`par-${index}`} position={[x, 9.05, -5.5]} rotation={[0.5, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.16, 0.32, 12]} />
              <meshStandardMaterial color={palette.metal} metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.165, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.12, 16]} />
              <meshBasicMaterial color={index % 2 ? palette.lilac : palette.orchid} toneMapped={false} side={2} />
            </mesh>
          </group>
        )
      })}
      <Truss z={1.4} width={stage.width + 2} />
      <Truss z={-5.5} width={stage.width + 2} />
      <Risers />
    </group>
  )
}
