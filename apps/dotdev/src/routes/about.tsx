import { createFileRoute } from "@tanstack/react-router"

function About() {
  return (
    <section className="flex min-h-[50vh] items-center justify-center py-8">
      <p className="font-mono text-sm text-muted-foreground">coming soon...</p>
    </section>
  )
}

export const Route = createFileRoute("/about")({
  component: About,
})
