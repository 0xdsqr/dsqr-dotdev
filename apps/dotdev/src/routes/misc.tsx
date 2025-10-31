import { createFileRoute } from "@tanstack/react-router"

function Misc() {
  return <div>misc</div>
}

export const Route = createFileRoute("/misc")({
  component: Misc,
})
