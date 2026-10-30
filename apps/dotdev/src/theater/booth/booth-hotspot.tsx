import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'
import { boothCenterZ, boothFloorY } from './geometry'

const styles = stylex.create({
  tag: {
    paddingBlock: '0.3rem',
    paddingInline: '0.7rem',
    borderRadius: '999px',
    backgroundColor: 'rgba(13, 8, 24, 0.8)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(196, 181, 253, 0.55)',
    color: '#ede9fe',
    fontFamily: '"Geist Mono Variable", ui-monospace, monospace',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
})

export function BoothHotspot({
  enabled,
  onEnter,
  children,
}: {
  enabled: boolean
  onEnter: () => void
  children: (hovered: boolean) => ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const active = enabled && hovered

  useEffect(() => {
    document.body.style.cursor = active ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [active])

  return (
    <group
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (!enabled || event.delta > 6) return
        event.stopPropagation()
        setHovered(false)
        onEnter()
      }}
    >
      {children(active)}
      {active && (
        <Html position={[0, boothFloorY + 2.6, boothCenterZ]} center zIndexRange={[20, 0]}>
          <span {...stylex.props(styles.tag)}>Control room</span>
        </Html>
      )}
    </group>
  )
}
