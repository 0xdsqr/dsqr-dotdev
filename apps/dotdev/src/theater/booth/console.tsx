import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, type InstancedMesh, Object3D } from 'three'
import { bounce, sway } from '../lib/beat'
import { materials } from '../lib/materials'
import { palette } from '../lib/palette'
import { deskTilt, deskY, deskZ } from './geometry'

const channels = 24
const knobRows = 4
const dummy = new Object3D()

function channelX(channel: number) {
  return -1.5 + (channel + 0.5) * (3 / channels)
}

export function Console() {
  const faders = useRef<InstancedMesh>(null)
  const knobs = useRef<InstancedMesh>(null)
  const meters = useRef<InstancedMesh>(null)
  const knobColors = useMemo(() => [palette.violet, palette.cyan, palette.amber, palette.stick].map((c) => new Color(c)), [])

  useLayoutEffect(() => {
    const mesh = knobs.current
    if (!mesh) return
    for (let channel = 0; channel < channels; channel++) {
      for (let row = 0; row < knobRows; row++) {
        dummy.position.set(channelX(channel), 0.055, -0.38 + row * 0.1)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        mesh.setMatrixAt(channel * knobRows + row, dummy.matrix)
        const color = knobColors[row]
        if (color) mesh.setColorAt(channel * knobRows + row, color)
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
      const x = channelX(channel)
      const level = 0.5 + sway(time * 0.3, channel * 0.9) * 0.35
      dummy.position.set(x, 0.065, 0.05 + (1 - level) * 0.3)
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
      <mesh material={materials.metal}>
        <boxGeometry args={[3.4, 0.08, 1.05]} />
      </mesh>
      <instancedMesh ref={faders} args={[undefined, materials.ivory, channels]} frustumCulled={false}>
        <boxGeometry args={[0.06, 0.05, 0.09]} />
      </instancedMesh>
      <instancedMesh ref={knobs} args={[undefined, undefined, channels * knobRows]} frustumCulled={false}>
        <cylinderGeometry args={[0.024, 0.024, 0.03, 10]} />
        <meshStandardMaterial roughness={0.4} emissive={palette.violet} emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={meters} args={[undefined, materials.cyan, channels]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.18, 0.02]} />
      </instancedMesh>
    </group>
  )
}
