import { stage } from '../lib/layout'
import { palette } from '../lib/palette'
import { pianoPosition } from '../piano/piano'
import { AimedSpot } from './aimed-spot'

const [px, py, pz] = pianoPosition
const pianoFocus = [px, py + 1, pz] as const

export function StageWash() {
  return (
    <group>
      <AimedSpot position={[-3, 10, 7]} target={pianoFocus} angle={0.3} penumbra={0.7} intensity={240} distance={30} color="#efe9ff" />
      <AimedSpot position={[3, 6, -7.4]} target={pianoFocus} angle={0.5} penumbra={0.9} intensity={160} distance={18} color={palette.orchid} />
      {[-6, -2, 2, 6].map((x) => (
        <pointLight key={x} position={[x, stage.height + 0.25, stage.front + 0.6]} intensity={9} distance={7} decay={1.6} color={palette.lilac} />
      ))}
    </group>
  )
}
