import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, type InstancedMesh, Object3D, SRGBColorSpace, Vector3 } from 'three'
import { bounce, sway } from '../beat'
import { booth, rowY, rowZ } from '../layout'
import { palette } from '../palette'
import { type Pose, StickFigure, solveElbow } from './stick-figure'

const floorY = rowY(booth.firstRow)
const centerZ = (rowZ(booth.firstRow) + rowZ(booth.lastRow)) / 2
const width = booth.halfWidth * 2
const depth = 4.4
const deskY = floorY + 0.95
const deskZ = centerZ - 0.9
const channels = 24
const knobRows = 4
const deskTilt = 0.32
const dummy = new Object3D()

function useScreen(seed: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 144
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    const context = canvas.getContext('2d')
    const draw = (time: number) => {
      if (!context) return
      context.fillStyle = '#0a0716'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = seed % 2 ? palette.cyan : palette.violet
      context.lineWidth = 3
      context.beginPath()
      for (let x = 0; x <= canvas.width; x += 4) {
        const y =
          canvas.height / 2 +
          Math.sin(x * 0.06 + time * 3 + seed) * 22 * (0.6 + bounce(time, seed) * 0.6) +
          Math.sin(x * 0.17 - time * 5) * 8
        if (x === 0) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.stroke()
      context.fillStyle = seed % 2 ? palette.violet : palette.cyan
      for (let bar = 0; bar < 16; bar++) {
        const height = 6 + Math.abs(Math.sin(time * 4 + bar * 0.7 + seed)) * 34
        context.fillRect(10 + bar * 15, canvas.height - 8 - height, 10, height)
      }
      texture.needsUpdate = true
    }
    return { texture, draw }
  }, [seed])
}

function Monitor({ x, seed }: { x: number; seed: number }) {
  const { texture, draw } = useScreen(seed)
  const frame = useRef(0)
  useFrame(({ clock }) => {
    if (frame.current++ % 3 === 0) draw(clock.elapsedTime)
  })
  return (
    <group position={[x, deskY + 0.55, deskZ - 0.55]} rotation={[-0.12, 0, 0]}>
      <mesh>
        <boxGeometry args={[1.05, 0.64, 0.05]} />
        <meshStandardMaterial color={palette.speaker} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[0.96, 0.56]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Console() {
  const faders = useRef<InstancedMesh>(null)
  const knobs = useRef<InstancedMesh>(null)
  const meters = useRef<InstancedMesh>(null)
  const knobColors = useMemo(() => [palette.violet, palette.cyan, palette.amber, palette.stick].map((c) => new Color(c)), [])

  useLayoutEffect(() => {
    const mesh = knobs.current
    if (!mesh) return
    for (let channel = 0; channel < channels; channel++) {
      for (let row = 0; row < knobRows; row++) {
        const x = -1.5 + (channel + 0.5) * (3 / channels)
        dummy.position.set(x, 0.055, -0.38 + row * 0.1)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        mesh.setMatrixAt(channel * knobRows + row, dummy.matrix)
        mesh.setColorAt(channel * knobRows + row, knobColors[row] ?? knobColors[0]!)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [knobColors])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    const fader = faders.current
    const meter = meters.current
    if (!fader || !meter) return
    for (let channel = 0; channel < channels; channel++) {
      const x = -1.5 + (channel + 0.5) * (3 / channels)
      const level = 0.5 + sway(time * 0.3, channel * 0.9) * 0.35
      dummy.position.set(x, 0.065, 0.05 + (1 - level) * 0.3)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      fader.setMatrixAt(channel, dummy.matrix)
      const loudness = 0.2 + bounce(time, channel * 0.4) * 0.6 + Math.abs(Math.sin(time * 7 + channel)) * 0.2
      dummy.position.set(x, 0.05 + loudness * 0.09, -0.47)
      dummy.scale.set(1, loudness, 1)
      dummy.updateMatrix()
      meter.setMatrixAt(channel, dummy.matrix)
    }
    fader.instanceMatrix.needsUpdate = true
    meter.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[0, deskY, deskZ]} rotation={[deskTilt, 0, 0]}>
      <mesh>
        <boxGeometry args={[3.4, 0.08, 1.05]} />
        <meshStandardMaterial color={palette.metal} metalness={0.5} roughness={0.45} />
      </mesh>
      <instancedMesh ref={faders} args={[undefined, undefined, channels]} frustumCulled={false}>
        <boxGeometry args={[0.06, 0.05, 0.09]} />
        <meshStandardMaterial color={palette.stick} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={knobs} args={[undefined, undefined, channels * knobRows]} frustumCulled={false}>
        <cylinderGeometry args={[0.024, 0.024, 0.03, 10]} />
        <meshStandardMaterial roughness={0.4} emissive={palette.violet} emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={meters} args={[undefined, undefined, channels]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.18, 0.02]} />
        <meshBasicMaterial color={palette.cyan} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

const pole = new Vector3()

function standing(x: number, time: number, pose: Pose, phase: number) {
  const nod = bounce(time, phase) * 0.03
  const z = centerZ + 0.15
  pose.pelvis.set(x, floorY + 0.95, z)
  pose.neck.set(x, floorY + 1.5, z - 0.12)
  pose.head.set(x, floorY + 1.72 - nod, z - 0.16 - nod)
  pose.shoulderL.set(x - 0.2, floorY + 1.47, z - 0.12)
  pose.shoulderR.set(x + 0.2, floorY + 1.47, z - 0.12)
  pose.hipL.set(x - 0.1, floorY + 0.9, z)
  pose.hipR.set(x + 0.1, floorY + 0.9, z)
  pose.kneeL.set(x - 0.11, floorY + 0.48, z - 0.04)
  pose.kneeR.set(x + 0.11, floorY + 0.48, z - 0.04)
  pose.footL.set(x - 0.12, floorY, z)
  pose.footR.set(x + 0.12, floorY + bounce(time, phase + 1) * 0.04, z)
}

function arms(pose: Pose) {
  solveElbow(pose.shoulderL, pose.handL, 0.3, 0.3, pole.set(-0.6, -1, 0.5), pose.elbowL)
  solveElbow(pose.shoulderR, pose.handR, 0.3, 0.3, pole.set(0.6, -1, 0.5), pose.elbowR)
}

function mixing(time: number, pose: Pose) {
  standing(-0.75, time, pose, 0.4)
  const reach = deskZ + 0.18
  pose.handL.set(-0.95 + sway(time * 0.4) * 0.25, deskY + 0.12, reach + sway(time * 0.9) * 0.08)
  pose.handR.set(-0.45 + sway(time * 0.25, 2) * 0.35, deskY + 0.12, reach + bounce(time * 0.5) * 0.1)
  arms(pose)
}

function listening(time: number, pose: Pose) {
  standing(0.85, time, pose, 2.1)
  pose.handL.set(0.68, floorY + 1.7, centerZ)
  pose.handR.set(1.1 + sway(time * 0.5, 1) * 0.12, deskY + 0.12, deskZ + 0.2)
  arms(pose)
}

function TechHead({ headphones }: { headphones?: boolean }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshStandardMaterial color={palette.stick} emissive={palette.violet} emissiveIntensity={0.3} />
      </mesh>
      {headphones && (
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.15, 0.022, 8, 24, Math.PI]} />
          <meshStandardMaterial color={palette.speaker} metalness={0.4} roughness={0.4} />
        </mesh>
      )}
    </group>
  )
}

export function TechBooth() {
  return (
    <group>
      <mesh position={[0, floorY / 2, centerZ]}>
        <boxGeometry args={[width, floorY, depth]} />
        <meshStandardMaterial color={palette.riser} roughness={0.9} />
      </mesh>
      <mesh position={[0, floorY + 0.5, centerZ - depth / 2 + 0.06]}>
        <boxGeometry args={[width, 1, 0.12]} />
        <meshStandardMaterial color={palette.wall} roughness={0.7} />
      </mesh>
      <mesh position={[0, floorY + 1.0, centerZ - depth / 2 + 0.07]}>
        <boxGeometry args={[width, 0.03, 0.14]} />
        <meshBasicMaterial color={palette.violet} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - 0.06), floorY + 0.5, centerZ]}>
          <boxGeometry args={[0.12, 1, depth]} />
          <meshStandardMaterial color={palette.wall} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, deskY - 0.45, deskZ]}>
        <boxGeometry args={[3.3, 0.9, 0.9]} />
        <meshStandardMaterial color={palette.speaker} roughness={0.6} />
      </mesh>
      <Console />
      <Monitor x={-0.9} seed={1} />
      <Monitor x={0.9} seed={2} />
      <StickFigure animate={mixing} head={<TechHead />} thickness={0.04} />
      <StickFigure animate={listening} head={<TechHead headphones />} thickness={0.04} />
    </group>
  )
}
