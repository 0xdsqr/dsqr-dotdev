import type { Post } from "@dsqr-dotdev/db/schema"
import { createFileRoute } from "@tanstack/react-router"
import { BlogPostHeader } from "../../components/blog-post-header"
import { BlogPostViewer } from "../../components/blog-post-viewer"
import { useTRPC } from "../../lib/trpc"

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.fetchQuery(
      context.trpc.post.bySlug.queryOptions({ slug: params.slug }),
    )

    if (!post) {
      throw new Error("Post not found")
    }

    const contentResult = await context.queryClient.fetchQuery(
      context.trpc.post.content.queryOptions({ filePath: post.filePath }),
    )

    return { post, contentResult }
  },
  component: PostDetailPage,
  notFoundComponent: () => (
    <div className="text-center py-16">Post not found</div>
  ),
})

function PostDetailPage() {
  const { post, contentResult } = Route.useLoaderData() as {
    post: Post
    contentResult: { success: boolean; content: string; error?: string }
  }

  if (!contentResult.success) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Error loading post</h1>
        <p className="text-muted-foreground">{contentResult.error}</p>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-3xl">
      <div className="space-y-8">
        <BlogPostHeader
          title={post.title}
          date={post.createdAt}
          category={post.category}
          readingTimeMinutes={post.readingTimeMinutes || 0}
          headerImageUrl={post.headerImageUrl || ""}
          tags={post.tags || []}
        />
        <BlogPostViewer content={contentResult.content} />
      </div>
    </div>
  )
}
