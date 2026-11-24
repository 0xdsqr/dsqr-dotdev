import appleTouchIconUrl from './assets/apple-touch-icon.png?url&no-inline'
import appCss from './styles/globals.css?url'
import markUrl from './assets/mark.svg?url'

type Meta = Record<string, string>
type Link = Record<string, string>

/**
 * Head tags every app shares: charset, viewport, title and description (plus their
 * Open Graph twins), icons, and the global stylesheet. Pages add their own with `pageHead`.
 */
export function siteHead({
  title,
  description,
  origin,
  image,
}: {
  title: string
  description?: string
  /** Public origin such as `https://dsqr.dev`; enables absolute share URLs. */
  origin?: string
  /** A fingerprinted image URL (imported with `?url`) for link previews. */
  image?: string
}): { meta: Array<Meta>; links: Array<Link> } {
  const meta: Array<Meta> = [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { title },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: title },
    { property: 'og:title', content: title },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
  ]
  if (description) {
    meta.push({ name: 'description', content: description }, { property: 'og:description', content: description })
  }
  if (origin && image) meta.push({ property: 'og:image', content: new URL(image, origin).href })
  return {
    meta,
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: markUrl },
      { rel: 'apple-touch-icon', href: appleTouchIconUrl },
    ],
  }
}

/** Per-page title and canonical URL (canonical only when the public origin is known). */
export function pageHead({ title, path, origin }: { title: string; path: string; origin?: string }) {
  return {
    meta: [{ title }, { property: 'og:title', content: title }] as Array<Meta>,
    links: origin ? [{ rel: 'canonical', href: new URL(path, origin).href }] : [],
  }
}
