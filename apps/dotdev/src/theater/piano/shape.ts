import { ExtrudeGeometry, Shape, ShapeGeometry } from 'three'

export const piano = {
  legHeight: 0.62,
  caseHeight: 0.3,
  keyTop: 0.735,
  keyboardWidth: 1.38,
  whiteCount: 52,
  lidAngle: 0.62,
  hingeZ: -0.75,
} as const

export const caseTop = piano.legHeight + piano.caseHeight
export const whiteWidth = piano.keyboardWidth / piano.whiteCount

function outline(inset = 0) {
  const shape = new Shape()
  const w = (value: number) => -value * (1 - inset)
  const x = (value: number) => value * (1 - inset) + inset * 0.6
  shape.moveTo(x(0), w(-0.75))
  shape.lineTo(x(0), w(0.75))
  shape.lineTo(x(0.55), w(0.75))
  shape.bezierCurveTo(x(1.0), w(0.75), x(1.05), w(0.15), x(1.55), w(0.0))
  shape.bezierCurveTo(x(1.95), w(-0.12), x(2.08), w(-0.45), x(1.95), w(-0.75))
  shape.lineTo(x(0), w(-0.75))
  return shape
}

export function pianoGeometry() {
  const body = new ExtrudeGeometry(outline(), {
    depth: piano.caseHeight,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 40,
  })
  body.rotateX(-Math.PI / 2)
  const lid = new ExtrudeGeometry(outline(), { depth: 0.02, bevelEnabled: false, curveSegments: 40 })
  lid.rotateX(-Math.PI / 2)
  lid.translate(0, 0, -piano.hingeZ)
  const plate = new ShapeGeometry(outline(0.08), 40)
  plate.rotateX(-Math.PI / 2)
  return { body, lid, plate }
}
