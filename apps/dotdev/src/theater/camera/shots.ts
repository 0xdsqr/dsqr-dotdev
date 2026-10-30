import { boothCenterZ, boothFloorY } from '../booth/geometry'

export type Shot = { readonly position: readonly [number, number, number]; readonly target: readonly [number, number, number] }

export const openingShot: Shot = { position: [0, 19, 46], target: [0.3, 2.2, -1.8] }

export function homeShot(portrait: boolean): Shot {
  return portrait
    ? { position: [0.8, 9.8, 23], target: [0.4, 2.1, -3.2] }
    : { position: [4.5, 11, 27], target: [0.3, 2.2, -1.8] }
}

export const boothShot: Shot = { position: [0, boothFloorY + 3.3, boothCenterZ + 3.1], target: [0.3, boothFloorY - 0.2, -3] }
