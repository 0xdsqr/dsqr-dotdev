import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BlogEditor } from "@/components/blog-editor"
import { useTRPC } from "@/lib/trpc"

export const Route = createFileRoute("/posts/$postId")({
  component: EditPost,
})

function EditPost() {
  const { postId } = Route.useParams()
  const trpc = useTRPC()

  // Fetch post metadata
  const { data: post, isLoading: postLoading } = useQuery(
    trpc.post.byId.queryOptions({ id: postId }),
  )

  // Fetch content (from DB or CDN)
  const { data: contentResult, isLoading: contentLoading } = useQuery({
    ...trpc.post.content.queryOptions({
      postId: postId,
      filePath: post?.filePath ?? undefined,
    }),
    enabled: !!post,
  })

  const isLoading = postLoading || contentLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-mono">loading post...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-mono">post not found</p>
      </div>
    )
  }

  // Get content from result or fallback to post.content
  const content = contentResult?.success
    ? contentResult.content
    : post.content || ""

  return (
    <BlogEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.description,
        content: content,
        filePath: post.filePath,
        category: post.category,
        tags: post.tags,
        published: post.published,
        headerImageUrl: post.headerImageUrl,
        readingTimeMinutes: post.readingTimeMinutes,
      }}
    />
  )
}
