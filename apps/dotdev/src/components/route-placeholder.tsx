interface RoutePlaceholderProps {
  routeName: string
}

export function RoutePlaceholder({ routeName }: RoutePlaceholderProps) {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 py-8">
      <p className="text-xs font-mono uppercase tracking-[0.35em] text-muted-foreground">0xdsqr</p>
      <h1 className="text-center font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
        Welcome to {routeName}
      </h1>
      <p className="max-w-xl text-center text-sm leading-7 text-muted-foreground sm:text-base">
        This page is intentionally minimal for now while we rebuild the site incrementally.
      </p>
      <div className="font-mono text-sm text-purple-600 dark:text-purple-400">/{routeName}</div>
    </section>
  )
}
