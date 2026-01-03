import { createFileRoute } from "@tanstack/react-router"
import { BlogEditor } from "@/components/blog-editor"

export const Route = createFileRoute("/posts/new")({
  component: NewPost,
})

function NewPost() {
  return <BlogEditor />
}
