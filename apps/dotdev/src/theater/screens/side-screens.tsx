import { useThree } from '@react-three/fiber'
import { stage } from '../lib/layout'
import { pianoPosition } from '../piano/piano'
import { type Lens, LiveFeed } from './live-feed'
import { ScreenFrame } from './screen-frame'

const x = stage.width / 2 + 3.5
const y = 7.2
const z = 0.9
const [px, py, pz] = pianoPosition

const lenses: Record<'left' | 'right', Lens> = {
  left: { position: [px - 3.4, py + 2.3, pz + 2.6], target: [px - 1.05, py + 1.55, pz], fov: 30, drift: 0.35 },
  right: { position: [px + 1.9, py + 1.9, pz + 2.4], target: [px - 0.9, py + 1.45, pz - 0.1], fov: 26, drift: 0.25 },
}

export function SideScreens({ still }: { still: boolean }) {
  const portrait = useThree((state) => state.size.width / state.size.height < 0.9)
  if (portrait) {
    return (
      <ScreenFrame position={[0.4, 11.9, 1.5]} pitch={0.18} scale={0.8} rigging={false}>
        <LiveFeed lens={lenses.left} slot={0} still={still} />
      </ScreenFrame>
    )
  }
  return (
    <group>
      <ScreenFrame position={[-x, y, z]} yaw={0.28}>
        <LiveFeed lens={lenses.left} slot={0} still={still} />
      </ScreenFrame>
      <ScreenFrame position={[x, y, z]} yaw={-0.28}>
        <LiveFeed lens={lenses.right} slot={1} still={still} />
      </ScreenFrame>
    </group>
  )
}
