import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PostList } from "../../components/post-list"
import { useTRPC } from "../../lib/trpc"

async function getPosts({ context }: { context: any }) {
  await context.queryClient.prefetchQuery(context.trpc.post.all.queryOptions())
}

export const Route = createFileRoute("/posts/")({
  loader: async ({ context }) => getPosts({ context }),
  component: PostsPage,
})

function PostsPage() {
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
