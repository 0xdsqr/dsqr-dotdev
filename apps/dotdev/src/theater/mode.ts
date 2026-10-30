import type { Destination } from '../content/destinations'

export type TheaterMode = 'crowd' | 'booth'

export type TheaterControls = {
  readonly mode: TheaterMode
  readonly enterBooth: () => void
  readonly select: (destination: Destination) => void
}
