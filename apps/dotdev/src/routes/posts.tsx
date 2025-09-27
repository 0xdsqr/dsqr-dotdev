import { createFileRoute } from "@tanstack/react-router"

function Posts() {
  return <div>posts</div>
}

const Route = createFileRoute("/posts")({
  component: Posts,
})

export { Route }
