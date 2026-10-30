export type Destination = {
  readonly id: 'blog' | 'about' | 'labs' | 'studio'
  readonly label: string
  readonly hint: string
  readonly href: string
}

export const destinations: ReadonlyArray<Destination> = [
  { id: 'blog', label: 'Blog', hint: 'Writing', href: '/blog' },
  { id: 'about', label: 'About', hint: 'The long version', href: '/about' },
  { id: 'labs', label: 'Labs', hint: 'Consulting', href: 'https://labs.dsqr.dev' },
  { id: 'studio', label: 'Studio', hint: 'Projects', href: 'https://studio.dsqr.dev' },
]

export function isExternal(destination: Destination) {
  return /^https?:\/\//.test(destination.href)
}
