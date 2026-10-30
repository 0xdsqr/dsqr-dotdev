import { Billboard, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  ExtrudeGeometry,
  type InstancedMesh,
  Object3D,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from 'three'
import portrait from '../../assets/portrait.webp'
import { bounce, bpm, sway } from '../beat'
import { stage } from '../layout'
import { palette } from '../palette'
import { type Pose, StickFigure, solveElbow } from './stick-figure'

const legHeight = 0.62
const caseHeight = 0.3
const caseTop = legHeight + caseHeight
const keyTop = 0.735
const keyboardWidth = 1.38
const whiteCount = 52
const whiteWidth = keyboardWidth / whiteCount
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
const sharps = new Set(['A', 'C', 'D', 'F', 'G'])
const lidAngle = 0.62
const hingeZ = -0.75

const blackKeys = Array.from({ length: whiteCount - 1 }, (_, index) => index).filter((index) =>
  sharps.has(letters[index % letters.length] ?? 'B'),
)

function whiteZ(index: number) {
  return -keyboardWidth / 2 + whiteWidth * (index + 0.5)
}

function outline(inset = 0) {
  const shape = new Shape()
  const w = (value: number) => -value * (1 - inset)
  const x = (value: number) => value * (1 - inset) + inset * 0.6
  shape.moveTo(x(0), w(-0.75))
  shape.lineTo(x(0), w(0.75))
  shape.lineTo(x(0.55), w(0.75))
  shape.bezierCurveTo(x(1.0), w(0.75), x(1.05), w(0.15), x(1.55), w(0.0))
  shape.bezierCurveTo(x(1.95), w(-0.12), x(2.08), w(-0.45), x(1.95), w(-0.75))
  shape.lineTo(x(0), w(-0.75))
  return shape
}

function useGeometries() {
  return useMemo(() => {
    const body = new ExtrudeGeometry(outline(), {
      depth: caseHeight,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 40,
    })
    body.rotateX(-Math.PI / 2)
    const lid = new ExtrudeGeometry(outline(), { depth: 0.02, bevelEnabled: false, curveSegments: 40 })
    lid.rotateX(-Math.PI / 2)
    lid.translate(0, 0, -hingeZ)
    const plate = new ShapeGeometry(outline(0.08), 40)
    plate.rotateX(-Math.PI / 2)
    return { body, lid, plate }
  }, [])
}

type Hands = { left: Vector3; right: Vector3; strikeLeft: number; strikeRight: number }

const omega = (Math.PI * 2 * bpm) / 60

function hands(time: number, out: Hands) {
  out.strikeLeft = Math.pow(Math.max(0, Math.sin(time * omega)), 3)
  out.strikeRight = Math.pow(Math.max(0, Math.sin(time * omega * 2 + 1.2)), 3)
  out.left.set(
    -0.1,
    keyTop + 0.03 + (1 - out.strikeLeft) * 0.045,
    -0.3 + Math.sin(time * 0.9) * 0.17 + Math.sin(time * 2.3) * 0.04,
  )
  out.right.set(
    -0.1,
    keyTop + 0.03 + (1 - out.strikeRight) * 0.04,
    0.27 + Math.sin(time * 1.1 + 1) * 0.19 + Math.sin(time * 3.1) * 0.04,
  )
  return out
}

const elbowPole = new Vector3()

function playing(state: Hands) {
  return (time: number, pose: Pose) => {
    hands(time, state)
    const nod = bounce(time, 0.6) * 0.02
    const drift = sway(time * 0.45) * 0.05
    pose.pelvis.set(-0.8, 0.6, drift * 0.3)
    pose.neck.set(-0.66, 1.17 - nod, drift)
    pose.head.set(-0.6 + nod, 1.42 - nod, drift * 1.2)
    pose.shoulderL.set(-0.67, 1.13 - nod, -0.19 + drift)
    pose.shoulderR.set(-0.67, 1.13 - nod, 0.19 + drift)
    pose.handL.copy(state.left)
    pose.handR.copy(state.right)
    solveElbow(pose.shoulderL, pose.handL, 0.32, 0.31, elbowPole.set(-0.4, -1, -0.5), pose.elbowL)
    solveElbow(pose.shoulderR, pose.handR, 0.32, 0.31, elbowPole.set(-0.4, -1, 0.5), pose.elbowR)
    pose.hipL.set(-0.78, 0.58, -0.1)
    pose.hipR.set(-0.78, 0.58, 0.1)
    pose.kneeL.set(-0.38, 0.6, -0.14)
    pose.kneeR.set(-0.38, 0.6, 0.14)
    pose.footL.set(-0.3, 0.02, -0.15)
    pose.footR.set(-0.27, 0.02 + bounce(time, 0.6) * 0.035, 0.12)
  }
}

function PortraitHead() {
  const texture = useTexture(portrait, (loaded: Texture) => {
    loaded.colorSpace = SRGBColorSpace
    loaded.repeat.set(1, 0.72)
    loaded.offset.set(0, 0.28)
  })
  const height = 0.4 * ((601 * 0.72) / 480)
  return (
    <Billboard>
      <mesh position={[0, 0.04, 0.05]}>
        <planeGeometry args={[0.4, height]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.08} />
      </mesh>
    </Billboard>
  )
}

const dummy = new Object3D()

function Keys({ state }: { state: Hands }) {
  const whites = useRef<InstancedMesh>(null)
  const blacks = useRef<InstancedMesh>(null)
  const pressed = useMemo(() => new Float32Array(whiteCount), [])

  useFrame(() => {
    const white = whites.current
    const black = blacks.current
    if (!white || !black) return
    for (let index = 0; index < whiteCount; index++) pressed[index] = (pressed[index] ?? 0) * 0.82
    for (const [hand, strike] of [
      [state.left, state.strikeLeft],
      [state.right, state.strikeRight],
    ] as const) {
      if (strike > 0.7) {
        const index = Math.round((hand.z + keyboardWidth / 2) / whiteWidth - 0.5)
        for (const key of [index, index + 2]) {
          if (key >= 0 && key < whiteCount) pressed[key] = 1
        }
      }
    }
    for (let index = 0; index < whiteCount; index++) {
      const depth = (pressed[index] ?? 0) * 0.008
      dummy.position.set(-0.075, keyTop - 0.011 - depth, whiteZ(index))
      dummy.rotation.set(0, 0, (pressed[index] ?? 0) * -0.05)
      dummy.updateMatrix()
      white.setMatrixAt(index, dummy.matrix)
    }
    blackKeys.forEach((index, slot) => {
      dummy.position.set(-0.035, keyTop + 0.008, -keyboardWidth / 2 + whiteWidth * (index + 1))
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      black.setMatrixAt(slot, dummy.matrix)
    })
    white.instanceMatrix.needsUpdate = true
    black.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={whites} args={[undefined, undefined, whiteCount]} frustumCulled={false}>
        <boxGeometry args={[0.15, 0.022, whiteWidth * 0.94]} />
        <meshStandardMaterial color="#f4f1fb" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={blacks} args={[undefined, undefined, blackKeys.length]} frustumCulled={false}>
        <boxGeometry args={[0.09, 0.03, whiteWidth * 0.55]} />
        <meshStandardMaterial color={palette.lacquer} roughness={0.3} />
      </instancedMesh>
    </group>
  )
}

const legs: ReadonlyArray<readonly [number, number]> = [
  [0.18, -0.6],
  [0.18, 0.6],
  [1.78, -0.45],
]

export function Piano() {
  const { body, lid, plate } = useGeometries()
  const state = useMemo<Hands>(
    () => ({ left: new Vector3(), right: new Vector3(), strikeLeft: 0, strikeRight: 0 }),
    [],
  )
  const animate = useMemo(() => playing(state), [state])
  const propZ = hingeZ + 1.05 * Math.cos(lidAngle)
  const propTop = caseTop + 1.05 * Math.sin(lidAngle)
  const lacquer = (
    <meshPhysicalMaterial color={palette.lacquer} roughness={0.22} metalness={0.15} clearcoat={1} clearcoatRoughness={0.06} />
  )

  return (
    <group position={[0.4, stage.height, -3.4]} scale={1.5}>
      <mesh geometry={body} position={[0, legHeight, 0]}>
        {lacquer}
      </mesh>
      <mesh geometry={plate} position={[0, caseTop + 0.017, 0]}>
        <meshStandardMaterial color={palette.brass} metalness={0.85} roughness={0.35} />
      </mesh>
      <group position={[0, caseTop + 0.02, hingeZ]} rotation={[-lidAngle, 0, 0]}>
        <mesh geometry={lid}>
          {lacquer}
        </mesh>
      </group>
      <mesh position={[0.95, (caseTop + propTop) / 2, propZ]}>
        <cylinderGeometry args={[0.012, 0.012, propTop - caseTop, 8]} />
        <meshStandardMaterial color={palette.lacquer} />
      </mesh>
      <mesh position={[-0.1, keyTop - 0.035, 0]}>
        <boxGeometry args={[0.24, 0.03, 1.5]} />
        {lacquer}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[-0.1, keyTop - 0.005, side * 0.725]}>
          <boxGeometry args={[0.24, 0.09, 0.05]} />
          {lacquer}
        </mesh>
      ))}
      <mesh position={[0.06, keyTop + 0.14, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.02, 0.22, 1.1]} />
        {lacquer}
      </mesh>
      <Keys state={state} />
      {legs.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, legHeight / 2, z]}>
          <cylinderGeometry args={[0.05, 0.035, legHeight, 12]} />
          {lacquer}
        </mesh>
      ))}
      <mesh position={[0.25, 0.25, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.18]} />
        {lacquer}
      </mesh>
      <mesh position={[-0.8, 0.26, 0]}>
        <boxGeometry args={[0.36, 0.52, 0.85]} />
        {lacquer}
      </mesh>
      <StickFigure animate={animate} head={<PortraitHead />} />
    </group>
  )
}
