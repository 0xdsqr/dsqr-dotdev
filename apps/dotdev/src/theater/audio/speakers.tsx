import { stage } from '../lib/layout'
import { palette } from '../lib/palette'
import { ceilingY } from '../venue/hall'
import { LineArray } from './line-array'
import { SubStack } from './sub-stack'

const mains = { x: stage.width / 2 - 1.2, y: 9.0, z: 2.2 } as const

const delays: ReadonlyArray<readonly [number, number, number]> = [
  [-6.2, 10.4, 12],
  [6.2, 10.4, 12],
  [-9.5, 10, 17],
  [9.5, 10, 17],
]

export function Speakers() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <LineArray position={[side * mains.x, mains.y, mains.z]} yaw={-side * 0.12} hang={9.4 - mains.y} />
          <pointLight position={[side * (mains.x - 1.2), mains.y - 1.2, mains.z + 2]} intensity={6} distance={5} decay={1.6} color={palette.lilac} />
        </group>
      ))}
      {delays.map(([x, y, z]) => (
        <LineArray key={`${x}-${z}`} position={[x, y, z]} yaw={x > 0 ? -0.35 : 0.35} boxes={3} hang={ceilingY - y} />
      ))}
      <SubStack x={-7.6} />
      <SubStack x={7.6} />
    </group>
  )
}
