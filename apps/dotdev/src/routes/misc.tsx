import { createFileRoute } from "@tanstack/react-router"
import { RoutePlaceholder } from "@/components/route-placeholder"

export const Route = createFileRoute("/misc")({
  component: MiscPage,
})

function MiscPage() {
  return <RoutePlaceholder routeName="misc" />
}
