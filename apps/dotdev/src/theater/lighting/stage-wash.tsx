import { useMemo } from 'react'
import { Object3D } from 'three'
import { stage } from '../lib/layout'
import { palette } from '../lib/palette'

export function StageWash() {
  const pianoTarget = useMemo(() => {
    const target = new Object3D()
    target.position.set(0.4, stage.height + 1, -3.4)
    return target
  }, [])
  return (
    <group>
      <primitive object={pianoTarget} />
      <spotLight
        position={[-3, 10, 7]}
        target={pianoTarget}
        angle={0.3}
        penumbra={0.7}
        intensity={240}
        distance={30}
        decay={1.5}
        color="#efe9ff"
      />
      <spotLight
        position={[3, 6, -7.4]}
        target={pianoTarget}
        angle={0.5}
        penumbra={0.9}
        intensity={160}
        distance={18}
        decay={1.5}
        color={palette.orchid}
      />
      {[-6, -2, 2, 6].map((x) => (
        <pointLight key={x} position={[x, stage.height + 0.25, stage.front + 0.6]} intensity={9} distance={7} decay={1.6} color={palette.lilac} />
      ))}
    </group>
  )
}
