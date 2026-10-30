import { booth, rowHalfWidth, rowY, rowZ, rows } from '../lib/layout'
import { seeded } from '../lib/random'

export type Mood = 'dance' | 'drink' | 'hands' | 'chill'

export type Person = {
  x: number
  y: number
  z: number
  yaw: number
  scale: number
  phase: number
  energy: number
  mood: Mood
  drinkEvery: number
}

export function createCrowd(seed: number) {
  {
    const random = seeded(seed)
    const people: Person[] = []
    for (let row = 0; row < rows.count; row++) {
      const half = rowHalfWidth(row)
      const spacing = 0.62
      for (let x = -half; x <= half; x += spacing) {
        const insideBooth = row >= booth.firstRow - 1 && row <= booth.lastRow && Math.abs(x) < booth.halfWidth + 0.4
        if (insideBooth || random() < 0.04) continue
        const jitter = (random() - 0.5) * 0.18
        const px = x + jitter
        const pz = rowZ(row, px) + (random() - 0.5) * 0.12
        const roll = random()
        people.push({
          x: px,
          y: rowY(row),
          z: pz,
          yaw: Math.atan2(px, pz + 4),
          scale: 0.9 + random() * 0.22,
          phase: random() * Math.PI * 2,
          energy: 0.4 + random() * 0.6,
          mood: roll < 0.12 ? 'drink' : roll < 0.22 ? 'hands' : roll < 0.7 ? 'dance' : 'chill',
          drinkEvery: 5 + random() * 6,
        })
      }
    }
    return { people, random }
  }
}

