import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  type InstancedMesh,
  Matrix4,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three'
import { bounce, sway } from '../lib/beat'
import { clothing, palette, skin } from '../lib/palette'
import { pick } from '../lib/random'
import { createCrowd } from './crowd'

const dummy = new Object3D()
const shoulder = new Vector3()
const offset = new Vector3()
const up = new Vector3(0, 1, 0)
const matrix = new Matrix4()

export function Audience() {
  const { people, random } = useMemo(() => createCrowd(2026), [])
  const armed = useMemo(() => people.filter((person) => person.mood === 'drink' || person.mood === 'hands'), [people])
  const armCount = armed.reduce((count, person) => count + (person.mood === 'hands' ? 2 : 1), 0)
  const drinkers = armed.filter((person) => person.mood === 'drink').length

  const bodies = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const arms = useRef<InstancedMesh>(null)
  const cups = useRef<InstancedMesh>(null)
  const sticks = useRef<InstancedMesh>(null)
  const raisers = armed.filter((person) => person.mood === 'hands').length * 2

  const geometries = useMemo(() => {
    const arm = new CylinderGeometry(0.034, 0.03, 0.56, 6)
    arm.translate(0, 0.28, 0)
    const cup = new CylinderGeometry(0.05, 0.04, 0.13, 8)
    const stick = new CapsuleGeometry(0.03, 0.16, 2, 6)
    return {
      body: new CapsuleGeometry(0.19, 0.5, 4, 10),
      head: new SphereGeometry(0.135, 12, 10),
      arm,
      cup,
      stick,
    }
  }, [])

  useLayoutEffect(() => {
    const color = new Color()
    people.forEach((person, index) => {
      bodies.current?.setColorAt(index, color.set(pick(clothing, random)))
      heads.current?.setColorAt(index, color.set(pick(skin, random)))
    })
    armed.forEach((person, index) => {
      arms.current?.setColorAt(index, color.set(pick(skin, random)))
    })
    const glow = [palette.violet, palette.cyan, '#f472b6', palette.lilac, palette.amber]
    for (let index = 0; index < raisers; index++) sticks.current?.setColorAt(index, color.set(pick(glow, random)))
    for (const mesh of [bodies.current, heads.current, arms.current, sticks.current]) {
      if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [people, armed, random, raisers])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    const body = bodies.current
    const head = heads.current
    const arm = arms.current
    const cup = cups.current
    const stick = sticks.current
    if (!body || !head || !arm || !cup || !stick) return
    let armIndex = 0
    let cupIndex = 0
    let stickIndex = 0
    people.forEach((person, index) => {
      const hop = person.mood === 'chill' ? 0 : bounce(time, person.phase) * 0.12 * person.energy
      const lean = sway(time, person.phase) * (person.mood === 'chill' ? 0.03 : 0.08) * person.energy
      const baseY = person.y + hop
      dummy.position.set(person.x, baseY + 0.62 * person.scale, person.z)
      dummy.rotation.set(0, person.yaw, lean)
      dummy.scale.setScalar(person.scale)
      dummy.updateMatrix()
      body.setMatrixAt(index, dummy.matrix)

      const drinking = person.mood === 'drink' ? Math.max(0, Math.sin(((time + person.phase) / person.drinkEvery) * Math.PI * 2)) : 0
      const sip = Math.pow(drinking, 3)
      offset.set(-Math.sin(lean) * 0.62 * person.scale, 0, sip * 0.05).applyAxisAngle(up, person.yaw)
      dummy.position.set(person.x + offset.x, baseY + 1.24 * person.scale, person.z + offset.z)
      dummy.rotation.set(-sip * 0.5, person.yaw, 0)
      dummy.updateMatrix()
      head.setMatrixAt(index, dummy.matrix)

      if (person.mood === 'drink' || person.mood === 'hands') {
        const sides = person.mood === 'hands' ? [-1, 1] : [1]
        for (const side of sides) {
          dummy.rotation.set(0, person.yaw, 0)
          shoulder.set(side * 0.22 * person.scale, 0.98 * person.scale, 0).applyEuler(dummy.rotation)
          dummy.position.set(person.x + shoulder.x, baseY + shoulder.y, person.z + shoulder.z)
          const raise =
            person.mood === 'hands'
              ? -0.3 + sway(time * 1.5, person.phase + side) * 0.25
              : -2.6 + sip * 2.05
          dummy.rotation.set(raise, person.yaw, side * (person.mood === 'hands' ? -0.25 : 0.15), 'YXZ')
          dummy.scale.setScalar(person.scale)
          dummy.updateMatrix()
          arm.setMatrixAt(armIndex++, dummy.matrix)
          if (person.mood === 'drink') {
            matrix.makeTranslation(0, 0.58, 0)
            dummy.matrix.multiply(matrix)
            cup.setMatrixAt(cupIndex++, dummy.matrix)
          } else {
            matrix.makeTranslation(0, 0.64, 0)
            dummy.matrix.multiply(matrix)
            stick.setMatrixAt(stickIndex++, dummy.matrix)
          }
        }
      }
    })
    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    arm.instanceMatrix.needsUpdate = true
    cup.instanceMatrix.needsUpdate = true
    stick.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodies} args={[geometries.body, undefined, people.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[geometries.head, undefined, people.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[geometries.arm, undefined, armCount]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={sticks} args={[geometries.stick, undefined, raisers]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={cups} args={[geometries.cup, undefined, drinkers]} frustumCulled={false}>
        <meshStandardMaterial color={palette.amber} emissive={palette.amber} emissiveIntensity={0.25} roughness={0.3} />
      </instancedMesh>
    </group>
  )
}
