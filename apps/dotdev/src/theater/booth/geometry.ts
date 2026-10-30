import { booth, rowY, rowZ } from '../lib/layout'

export const boothFloorY = rowY(booth.firstRow)
export const boothCenterZ = (rowZ(booth.firstRow) + rowZ(booth.lastRow)) / 2
export const boothWidth = booth.halfWidth * 2
export const boothDepth = 4.4
export const deskY = boothFloorY + 0.95
export const deskZ = boothCenterZ - 0.9
export const deskTilt = 0.32
