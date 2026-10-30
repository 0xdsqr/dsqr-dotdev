import { DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { palette } from './palette'

function neon(color: string) {
  return new MeshBasicMaterial({ color, toneMapped: false, side: DoubleSide })
}

export const materials = {
  floor: new MeshStandardMaterial({ color: palette.floor, roughness: 0.9 }),
  stage: new MeshStandardMaterial({ color: palette.stage, roughness: 0.55, metalness: 0.1 }),
  wall: new MeshStandardMaterial({ color: palette.wall, roughness: 0.85 }),
  riser: new MeshStandardMaterial({ color: palette.riser, roughness: 0.95 }),
  metal: new MeshStandardMaterial({ color: palette.metal, metalness: 0.8, roughness: 0.35 }),
  cabinet: new MeshStandardMaterial({ color: palette.cabinet, metalness: 0.45, roughness: 0.38 }),
  grille: new MeshStandardMaterial({ color: palette.grille, roughness: 0.75, metalness: 0.2 }),
  rubber: new MeshStandardMaterial({ color: palette.speaker, roughness: 0.7 }),
  lacquer: new MeshPhysicalMaterial({
    color: palette.lacquer,
    roughness: 0.22,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  }),
  brass: new MeshStandardMaterial({ color: palette.brass, metalness: 0.85, roughness: 0.35 }),
  ivory: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.35 }),
  velvet: new MeshPhysicalMaterial({
    color: palette.velvet,
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.4,
    sheenColor: palette.orchid,
  }),
  stick: new MeshStandardMaterial({ color: palette.stick, emissive: palette.violet, emissiveIntensity: 0.18, roughness: 0.6 }),
  violet: neon(palette.violet),
  lilac: neon(palette.lilac),
  orchid: neon(palette.orchid),
  cyan: neon(palette.cyan),
} as const
