import { createFileRoute } from "@tanstack/react-router"

function Misc() {
  return <div>misc</div>
}

const Route = createFileRoute("/misc")({
  component: Misc,
})

export { Route }
