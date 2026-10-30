import { stage } from '../lib/layout'
import { materials } from '../lib/materials'
import { Curtain } from './curtain'
import { ParCans } from './par-cans'
import { Proscenium } from './proscenium'
import { Risers } from './risers'
import { Truss } from './truss'

export const ceilingY = 16

export function Hall() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} material={materials.floor}>
        <planeGeometry args={[90, 90]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceilingY, 8]} material={materials.wall}>
        <planeGeometry args={[90, 90]} />
      </mesh>
      <mesh position={[0, stage.height / 2, -stage.depth / 2]} material={materials.stage}>
        <boxGeometry args={[stage.width, stage.height, stage.depth]} />
      </mesh>
      <mesh position={[0, stage.height - 0.02, stage.front + 0.03]} material={materials.violet}>
        <boxGeometry args={[stage.width, 0.04, 0.04]} />
      </mesh>
      <Curtain />
      <Proscenium />
      <mesh position={[0, 9, -11]} material={materials.wall}>
        <planeGeometry args={[60, 20]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 24, 9, 10]} rotation={[0, -side * (Math.PI / 2), 0]} material={materials.wall}>
          <planeGeometry args={[50, 20]} />
        </mesh>
      ))}
      <Truss z={1.4} width={stage.width + 2} />
      <Truss z={-5.5} width={stage.width + 2} />
      <ParCans z={-5.5} y={9.05} />
      <Risers />
    </group>
  )
}
