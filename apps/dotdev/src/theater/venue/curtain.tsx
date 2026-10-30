import { useMemo } from 'react'
import { PlaneGeometry } from 'three'
import { stage } from '../lib/layout'
import { materials } from '../lib/materials'

export function Curtain() {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(stage.width + 4, 10, 180, 1)
    const position = plane.attributes.position
    if (position) {
      for (let index = 0; index < position.count; index++) {
        const x = position.getX(index)
        position.setZ(index, Math.sin(x * 2.4) * 0.16 + Math.sin(x * 0.7) * 0.08)
      }
    }
    plane.computeVertexNormals()
    return plane
  }, [])
  return <mesh geometry={geometry} material={materials.velvet} position={[0, stage.height + 5, -stage.depth + 0.4]} />
}
