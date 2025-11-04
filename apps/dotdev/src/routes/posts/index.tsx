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
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Blog Posts
      </h1>
      <PostList posts={posts} />
    </div>
  )
}
