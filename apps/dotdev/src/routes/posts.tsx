import { createFileRoute } from "@tanstack/react-router"

function Posts() {
  return <div>posts</div>
}

export const Route = createFileRoute("/posts")({
  component: Posts,
})
