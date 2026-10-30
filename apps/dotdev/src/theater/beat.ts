export const bpm = 96

const omega = (Math.PI * 2 * bpm) / 60

export function sway(time: number, phase = 0) {
  return Math.sin(time * omega * 0.5 + phase)
}

export function bounce(time: number, phase = 0) {
  return Math.max(0, Math.sin(time * omega + phase))
}

export function kick(time: number) {
  return Math.pow(Math.max(0, Math.sin(time * omega)), 12)
}
