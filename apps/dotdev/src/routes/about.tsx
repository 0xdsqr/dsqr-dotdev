import { createFileRoute } from "@tanstack/react-router"
import { RoutePlaceholder } from "@/components/route-placeholder"

function About() {
  return <RoutePlaceholder routeName="about" />
}

export const Route = createFileRoute("/about")({
  component: About,
})
