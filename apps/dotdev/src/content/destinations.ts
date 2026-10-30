export type Destination = {
  readonly id: 'blog' | 'about' | 'misc'
  readonly label: string
  readonly hint: string
  readonly href: '/blog' | '/about' | '/misc'
}

export const destinations: ReadonlyArray<Destination> = [
  { id: 'blog', label: 'Blog', hint: 'Writing', href: '/blog' },
  { id: 'about', label: 'About', hint: 'The long version', href: '/about' },
  { id: 'misc', label: 'Misc', hint: 'Odds and ends', href: '/misc' },
]
