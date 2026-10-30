import { Vector3 } from 'three'
import { type Pose, StickFigure, solveElbow } from '../characters/stick-figure'
import { bounce, sway } from '../lib/beat'
import { materials } from '../lib/materials'
import { boothCenterZ, boothFloorY, deskY, deskZ } from './geometry'

const pole = new Vector3()

function stand(x: number, time: number, pose: Pose, phase: number) {
  const nod = bounce(time, phase) * 0.03
  const z = boothCenterZ + 0.15
  const y = boothFloorY
  pose.pelvis.set(x, y + 0.95, z)
  pose.neck.set(x, y + 1.5, z - 0.12)
  pose.head.set(x, y + 1.72 - nod, z - 0.16 - nod)
  pose.shoulderL.set(x - 0.2, y + 1.47, z - 0.12)
  pose.shoulderR.set(x + 0.2, y + 1.47, z - 0.12)
  pose.hipL.set(x - 0.1, y + 0.9, z)
  pose.hipR.set(x + 0.1, y + 0.9, z)
  pose.kneeL.set(x - 0.11, y + 0.48, z - 0.04)
  pose.kneeR.set(x + 0.11, y + 0.48, z - 0.04)
  pose.footL.set(x - 0.12, y, z)
  pose.footR.set(x + 0.12, y + bounce(time, phase + 1) * 0.04, z)
}

function bendArms(pose: Pose) {
  solveElbow(pose.shoulderL, pose.handL, 0.3, 0.3, pole.set(-0.6, -1, 0.5), pose.elbowL)
  solveElbow(pose.shoulderR, pose.handR, 0.3, 0.3, pole.set(0.6, -1, 0.5), pose.elbowR)
}

function mixing(time: number, pose: Pose) {
  stand(-0.75, time, pose, 0.4)
  const reach = deskZ + 0.18
  pose.handL.set(-0.95 + sway(time * 0.4) * 0.25, deskY + 0.12, reach + sway(time * 0.9) * 0.08)
  pose.handR.set(-0.45 + sway(time * 0.25, 2) * 0.35, deskY + 0.12, reach + bounce(time * 0.5) * 0.1)
  bendArms(pose)
}

function listening(time: number, pose: Pose) {
  stand(0.85, time, pose, 2.1)
  pose.handL.set(0.68, boothFloorY + 1.7, boothCenterZ)
  pose.handR.set(1.1 + sway(time * 0.5, 1) * 0.12, deskY + 0.12, deskZ + 0.2)
  bendArms(pose)
}

function TechHead({ headphones = false }: { headphones?: boolean }) {
  return (
    <group>
      <mesh material={materials.stick}>
        <sphereGeometry args={[0.14, 16, 12]} />
      </mesh>
      {headphones && (
        <mesh rotation={[0, Math.PI / 2, 0]} material={materials.rubber}>
          <torusGeometry args={[0.15, 0.022, 8, 24, Math.PI]} />
        </mesh>
      )}
    </group>
  )
}

export function Techs() {
  return (
    <group>
      <StickFigure animate={mixing} head={<TechHead />} thickness={0.04} />
      <StickFigure animate={listening} head={<TechHead headphones />} thickness={0.04} />
    </group>
  )
}
