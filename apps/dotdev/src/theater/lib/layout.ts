export const stage = { width: 18, depth: 9, height: 1.1, front: 0 } as const

export const rows = { count: 14, start: 4.6, spacing: 1.25, rise: 0.42, curve: 0.012 } as const

export const booth = { firstRow: 6, lastRow: 9, halfWidth: 3.1 } as const

export function rowZ(row: number, x = 0) {
  return rows.start + row * rows.spacing + x * x * rows.curve
}

export function rowY(row: number) {
  return row * rows.rise
}

export function rowHalfWidth(row: number) {
  return 8.5 + row * 0.55
}
