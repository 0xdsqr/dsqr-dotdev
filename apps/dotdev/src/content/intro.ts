export type IntroTone = 'accent' | 'teal' | 'orange' | 'emerald' | 'indigo' | 'quiet'

export type IntroSegment = { readonly text: string; readonly tone?: IntroTone }

export const handle = '0xdsqr'

export const intro: ReadonlyArray<IntroSegment> = [
  { text: "Dad of one. I'm primarily interested in " },
  { text: 'infrastructure', tone: 'accent' },
  { text: ', ' },
  { text: 'systems', tone: 'teal' },
  { text: ', ' },
  { text: 'platforms', tone: 'orange' },
  { text: ', ' },
  { text: 'making things fast', tone: 'emerald' },
  { text: ', and ' },
  { text: 'operations', tone: 'indigo' },
  { text: '. Currently building infrastructure and systems at ' },
  { text: 'Stablecore', tone: 'quiet' },
  { text: '. I also enjoy hardware, Nix, and collecting things that are nice to look at.' },
]

export const introText = intro.map((segment) => segment.text).join('')
