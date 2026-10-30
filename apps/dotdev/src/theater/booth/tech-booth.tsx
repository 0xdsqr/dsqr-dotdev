import { materials } from '../lib/materials'
import { Console } from './console'
import { boothCenterZ, boothDepth, boothFloorY, boothWidth, deskY, deskZ } from './geometry'
import { Monitor } from './monitor'
import { Techs } from './techs'

export function TechBooth() {
  return (
    <group>
      <mesh position={[0, boothFloorY / 2, boothCenterZ]} material={materials.riser}>
        <boxGeometry args={[boothWidth, boothFloorY, boothDepth]} />
      </mesh>
      <mesh position={[0, boothFloorY + 0.5, boothCenterZ - boothDepth / 2 + 0.06]} material={materials.wall}>
        <boxGeometry args={[boothWidth, 1, 0.12]} />
      </mesh>
      <mesh position={[0, boothFloorY + 1.0, boothCenterZ - boothDepth / 2 + 0.07]} material={materials.violet}>
        <boxGeometry args={[boothWidth, 0.03, 0.14]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (boothWidth / 2 - 0.06), boothFloorY + 0.5, boothCenterZ]} material={materials.wall}>
          <boxGeometry args={[0.12, 1, boothDepth]} />
        </mesh>
      ))}
      <mesh position={[0, deskY - 0.45, deskZ]} material={materials.rubber}>
        <boxGeometry args={[3.3, 0.9, 0.9]} />
      </mesh>
      <Console />
      <Monitor x={-0.9} seed={1} />
      <Monitor x={0.9} seed={2} />
      <Techs />
    </group>
  )
}
