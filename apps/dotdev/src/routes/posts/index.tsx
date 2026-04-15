import { createFileRoute } from "@tanstack/react-router"
import { RoutePlaceholder } from "@/components/route-placeholder"

export const Route = createFileRoute("/posts/")({
  component: PostsIndexPage,
})

function PostsIndexPage() {
  return <RoutePlaceholder routeName="posts" />
}
