import { SpotLight } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CylinderGeometry, type Group, type SpotLight as SpotLightImpl, Vector3 } from 'three'
import { palette } from '../lib/palette'

const rigs = [
  { x: -7.5, color: palette.violet, speed: 0.31, phase: 0 },
  { x: -2.5, color: palette.lilac, speed: 0.27, phase: 1.7 },
  { x: 2.5, color: palette.orchid, speed: 0.35, phase: 3.1 },
  { x: 7.5, color: palette.violet, speed: 0.29, phase: 4.4 },
] as const

const mountY = 9.05
const mountZ = 1.4
const aim = new Vector3()

function MovingHead({ x, color, speed, phase }: (typeof rigs)[number]) {
  const light = useRef<SpotLightImpl>(null)
  const head = useRef<Group>(null)
  const housing = useMemo(() => {
    const geometry = new CylinderGeometry(0.2, 0.28, 0.55, 16)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * speed
    aim.set(
      x * 0.45 + Math.sin(time + phase) * 6.5,
      0.4,
      -3.5 + Math.sin(time * 0.71 + phase * 1.3) * 7.5,
    )
    const spot = light.current
    if (spot) {
      spot.target.position.copy(aim)
      spot.target.updateMatrixWorld()
    }
    head.current?.lookAt(aim)
  })

  return (
    <group position={[x, mountY, mountZ]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshStandardMaterial color={palette.metal} metalness={0.7} roughness={0.4} />
      </mesh>
      <group ref={head}>
        <mesh geometry={housing}>
          <meshStandardMaterial color={palette.speaker} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.28]}>
          <circleGeometry args={[0.19, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <SpotLight
        ref={light}
        color={color}
        intensity={260}
        distance={24}
        decay={1.4}
        angle={0.26}
        penumbra={0.55}
        attenuation={16}
        anglePower={4.5}
        radiusTop={0.16}
        opacity={0.55}
      />
    </group>
  )
}

export function Spotlights() {
  return (
    <group>
      {rigs.map((rig) => (
        <MovingHead key={rig.x} {...rig} />
      ))}
    </group>
  )
}
