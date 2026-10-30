import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { bounce } from '../lib/beat'
import { materials } from '../lib/materials'
import { palette } from '../lib/palette'
import { deskY, deskZ } from './geometry'

function useScope(seed: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 144
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    const context = canvas.getContext('2d')
    const primary = seed % 2 ? palette.cyan : palette.violet
    const secondary = seed % 2 ? palette.violet : palette.cyan
    const draw = (time: number) => {
      if (!context) return
      context.fillStyle = '#0a0716'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.strokeStyle = primary
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
      context.fillStyle = secondary
      for (let bar = 0; bar < 16; bar++) {
        const height = 6 + Math.abs(Math.sin(time * 4 + bar * 0.7 + seed)) * 34
        context.fillRect(10 + bar * 15, canvas.height - 8 - height, 10, height)
      }
      texture.needsUpdate = true
    }
    return { texture, draw }
  }, [seed])
}

export function Monitor({ x, seed }: { x: number; seed: number }) {
  const { texture, draw } = useScope(seed)
  const frame = useRef(0)
  useEffect(() => {
    draw(0)
    return () => texture.dispose()
  }, [draw, texture])
  useFrame(({ clock }) => {
    if (frame.current++ % 3 === 0) draw(clock.elapsedTime)
  })
  return (
    <group position={[x, deskY + 0.55, deskZ - 0.55]} rotation={[-0.12, 0, 0]}>
      <mesh material={materials.rubber}>
        <boxGeometry args={[1.05, 0.64, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[0.96, 0.56]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}
