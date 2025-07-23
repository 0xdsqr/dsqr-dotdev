import { createFileRoute } from "@tanstack/react-router"

function About() {
  return <div>about</div>
}

const Route = createFileRoute("/about")({
  component: About,
})

export { Route }
