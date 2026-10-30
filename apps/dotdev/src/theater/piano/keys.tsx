import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type InstancedMesh, Object3D } from 'three'
import { materials } from '../lib/materials'
import type { Hands } from './performance'
import { piano, whiteWidth } from './shape'

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
const sharps = new Set(['A', 'C', 'D', 'F', 'G'])
const blackKeys = Array.from({ length: piano.whiteCount - 1 }, (_, index) => index).filter((index) =>
  sharps.has(letters[index % letters.length] ?? 'B'),
)
const dummy = new Object3D()

function whiteZ(index: number) {
  return -piano.keyboardWidth / 2 + whiteWidth * (index + 0.5)
}

export function Keys({ hands }: { hands: Hands }) {
  const whites = useRef<InstancedMesh>(null)
  const blacks = useRef<InstancedMesh>(null)
  const pressed = useMemo(() => new Float32Array(piano.whiteCount), [])

  useFrame(() => {
    const white = whites.current
    const black = blacks.current
    if (!white || !black) return
    for (let index = 0; index < piano.whiteCount; index++) pressed[index] = (pressed[index] ?? 0) * 0.82
    for (const [hand, strike] of [
      [hands.left, hands.strikeLeft],
      [hands.right, hands.strikeRight],
    ] as const) {
      if (strike < 0.7) continue
      const index = Math.round((hand.z + piano.keyboardWidth / 2) / whiteWidth - 0.5)
      for (const key of [index, index + 2]) if (key >= 0 && key < piano.whiteCount) pressed[key] = 1
    }
    for (let index = 0; index < piano.whiteCount; index++) {
      const depth = pressed[index] ?? 0
      dummy.position.set(-0.075, piano.keyTop - 0.011 - depth * 0.008, whiteZ(index))
      dummy.rotation.set(0, 0, depth * -0.05)
      dummy.updateMatrix()
      white.setMatrixAt(index, dummy.matrix)
    }
    blackKeys.forEach((index, slot) => {
      dummy.position.set(-0.035, piano.keyTop + 0.008, -piano.keyboardWidth / 2 + whiteWidth * (index + 1))
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      black.setMatrixAt(slot, dummy.matrix)
    })
    white.instanceMatrix.needsUpdate = true
    black.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={whites} args={[undefined, materials.ivory, piano.whiteCount]} frustumCulled={false}>
        <boxGeometry args={[0.15, 0.022, whiteWidth * 0.94]} />
      </instancedMesh>
      <instancedMesh ref={blacks} args={[undefined, materials.lacquer, blackKeys.length]} frustumCulled={false}>
        <boxGeometry args={[0.09, 0.03, whiteWidth * 0.55]} />
      </instancedMesh>
    </group>
  )
}
