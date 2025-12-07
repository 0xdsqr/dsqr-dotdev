import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PostList } from "../../components/post-list"
import { useTRPC } from "../../lib/trpc"

export const Route = createFileRoute("/posts/")({
  component: PostsIndexPage,
})

function PostsIndexPage() {
  const trpc = useTRPC()
  const { data: posts } = useSuspenseQuery(trpc.post.all.queryOptions())

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold font-mono border-b-2 border-dotted border-border pb-2">
        all posts
      </h1>
      <PostList posts={posts} />
    </div>
  )
}
