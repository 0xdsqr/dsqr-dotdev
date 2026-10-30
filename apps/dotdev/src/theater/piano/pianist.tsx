import { useMemo } from 'react'
import { Vector3 } from 'three'
import { PortraitHead } from '../characters/portrait-head'
import { type Pose, StickFigure, solveElbow } from '../characters/stick-figure'
import { bounce, sway } from '../lib/beat'
import { type Hands, playHands } from './performance'

const pole = new Vector3()
const spine = new Vector3()

function perform(hands: Hands) {
  return (time: number, pose: Pose) => {
    playHands(time, hands)
    const nod = bounce(time, 0.6) * 0.025
    const drift = sway(time * 0.45) * 0.06
    const reach = (hands.left.z + hands.right.z) * 0.12
    pose.pelvis.set(-0.8, 0.6, drift * 0.3)
    pose.neck.set(-0.64 + nod, 1.16 - nod * 0.5, drift + reach)
    spine.subVectors(pose.neck, pose.pelvis).normalize()
    pose.head.copy(pose.neck).addScaledVector(spine, 0.06)
    pose.shoulderL.set(-0.66 + nod, 1.12 - nod * 0.5, -0.19 + drift + reach)
    pose.shoulderR.set(-0.66 + nod, 1.12 - nod * 0.5, 0.19 + drift + reach)
    pose.handL.copy(hands.left)
    pose.handR.copy(hands.right)
    solveElbow(pose.shoulderL, pose.handL, 0.32, 0.31, pole.set(-0.4, -1, -0.5), pose.elbowL)
    solveElbow(pose.shoulderR, pose.handR, 0.32, 0.31, pole.set(-0.4, -1, 0.5), pose.elbowR)
    pose.hipL.set(-0.78, 0.58, -0.1)
    pose.hipR.set(-0.78, 0.58, 0.1)
    pose.kneeL.set(-0.38, 0.6, -0.14)
    pose.kneeR.set(-0.38, 0.6, 0.14)
    pose.footL.set(-0.3, 0.02, -0.15)
    pose.footR.set(-0.27, 0.02 + bounce(time, 0.6) * 0.035, 0.12)
  }
}

export function Pianist({ hands }: { hands: Hands }) {
  const animate = useMemo(() => perform(hands), [hands])
  return <StickFigure animate={animate} head={<PortraitHead />} />
}
