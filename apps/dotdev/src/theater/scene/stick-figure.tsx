import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { CylinderGeometry, type Group, type Mesh, Quaternion, Vector3 } from 'three'
import { palette } from '../palette'

export type Pose = Record<Joint, Vector3>

type Joint =
  | 'pelvis'
  | 'neck'
  | 'head'
  | 'shoulderL'
  | 'elbowL'
  | 'handL'
  | 'shoulderR'
  | 'elbowR'
  | 'handR'
  | 'hipL'
  | 'kneeL'
  | 'footL'
  | 'hipR'
  | 'kneeR'
  | 'footR'

const joints: ReadonlyArray<Joint> = [
  'pelvis', 'neck', 'head', 'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR',
  'hipL', 'kneeL', 'footL', 'hipR', 'kneeR', 'footR',
]

const limbs: ReadonlyArray<readonly [Joint, Joint]> = [
  ['pelvis', 'neck'],
  ['neck', 'shoulderL'],
  ['shoulderL', 'elbowL'],
  ['elbowL', 'handL'],
  ['neck', 'shoulderR'],
  ['shoulderR', 'elbowR'],
  ['elbowR', 'handR'],
  ['pelvis', 'hipL'],
  ['hipL', 'kneeL'],
  ['kneeL', 'footL'],
  ['pelvis', 'hipR'],
  ['hipR', 'kneeR'],
  ['kneeR', 'footR'],
]

export function makePose(): Pose {
  return Object.fromEntries(joints.map((joint) => [joint, new Vector3()])) as Pose
}

const up = new Vector3(0, 1, 0)
const direction = new Vector3()
const rotation = new Quaternion()

function span(mesh: Mesh, from: Vector3, to: Vector3, thickness: number) {
  direction.subVectors(to, from)
  const length = direction.length()
  mesh.position.addVectors(from, to).multiplyScalar(0.5)
  mesh.quaternion.copy(rotation.setFromUnitVectors(up, direction.normalize()))
  mesh.scale.set(thickness, Math.max(length, 0.0001), thickness)
}

const axis = new Vector3()
const lateral = new Vector3()

export function solveElbow(
  shoulder: Vector3,
  hand: Vector3,
  upper: number,
  fore: number,
  pole: Vector3,
  out: Vector3,
) {
  axis.subVectors(hand, shoulder)
  const distance = Math.min(axis.length(), (upper + fore) * 0.999)
  axis.normalize()
  const along = (upper * upper - fore * fore + distance * distance) / (2 * distance)
  const height = Math.sqrt(Math.max(upper * upper - along * along, 0))
  lateral.copy(pole).addScaledVector(axis, -pole.dot(axis)).normalize()
  return out.copy(shoulder).addScaledVector(axis, along).addScaledVector(lateral, height)
}

export function StickFigure({
  animate,
  head,
  thickness = 0.045,
  color = palette.stick,
}: {
  animate: (time: number, pose: Pose) => void
  head: ReactNode
  thickness?: number
  color?: string
}) {
  const pose = useMemo(makePose, [])
  const geometry = useMemo(() => new CylinderGeometry(1, 1, 1, 10), [])
  const segments = useRef<Array<Mesh | null>>([])
  const hands = useRef<Array<Mesh | null>>([])
  const headGroup = useRef<Group>(null)

  useFrame(({ clock }) => {
    animate(clock.elapsedTime, pose)
    limbs.forEach(([from, to], index) => {
      const mesh = segments.current[index]
      if (mesh) span(mesh, pose[from], pose[to], thickness)
    })
    hands.current[0]?.position.copy(pose.handL)
    hands.current[1]?.position.copy(pose.handR)
    headGroup.current?.position.copy(pose.head)
  })

  return (
    <group>
      {limbs.map(([from, to], index) => (
        <mesh
          key={`${from}-${to}`}
          ref={(mesh) => {
            segments.current[index] = mesh
          }}
          geometry={geometry}
        >
          <meshStandardMaterial color={color} emissive={palette.violet} emissiveIntensity={0.18} roughness={0.6} />
        </mesh>
      ))}
      {[0, 1].map((index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            hands.current[index] = mesh
          }}
        >
          <sphereGeometry args={[thickness * 1.5, 10, 10]} />
          <meshStandardMaterial color={color} emissive={palette.violet} emissiveIntensity={0.35} />
        </mesh>
      ))}
      <group ref={headGroup}>{head}</group>
    </group>
  )
}
