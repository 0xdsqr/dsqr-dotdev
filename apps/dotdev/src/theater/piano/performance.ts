import { Vector3 } from 'three'
import { bpm } from '../lib/beat'
import { piano } from './shape'

export type Hands = { left: Vector3; right: Vector3; strikeLeft: number; strikeRight: number }

const omega = (Math.PI * 2 * bpm) / 60

export function createHands(): Hands {
  return { left: new Vector3(), right: new Vector3(), strikeLeft: 0, strikeRight: 0 }
}

export function playHands(time: number, hands: Hands) {
  hands.strikeLeft = Math.pow(Math.max(0, Math.sin(time * omega)), 3)
  hands.strikeRight = Math.pow(Math.max(0, Math.sin(time * omega * 2 + 1.2)), 3)
  hands.left.set(
    -0.1,
    piano.keyTop + 0.03 + (1 - hands.strikeLeft) * 0.045,
    -0.3 + Math.sin(time * 0.9) * 0.17 + Math.sin(time * 2.3) * 0.04,
  )
  hands.right.set(
    -0.1,
    piano.keyTop + 0.03 + (1 - hands.strikeRight) * 0.04,
    0.27 + Math.sin(time * 1.1 + 1) * 0.19 + Math.sin(time * 3.1) * 0.04,
  )
  return hands
}
