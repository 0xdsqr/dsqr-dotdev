import { useQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { BlogPostViewer } from "@dsqr-dotdev/react/components/blog-post-viewer"
import { ReadingProgress } from "@dsqr-dotdev/react/components/reading-progress"
import { ScrollLines } from "@dsqr-dotdev/react/components/scroll-lines"
import { useRef } from "react"
import { BlogComments } from "../../components/blog-comments"
import { BlogPostHeader } from "../../components/blog-post-header"
import { useTRPC } from "@/lib/trpc"

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.fetchQuery(
      context.trpc.post.bySlug.queryOptions({ slug: params.slug }),
    )

    if (!post) {
      throw notFound()
    }

    const [contentResult] = await Promise.all([
      context.queryClient.fetchQuery(
        context.trpc.post.content.queryOptions({
          postId: post.id,
          filePath: post.filePath ?? undefined,
        }),
      ),
      context.queryClient.prefetchQuery(
        context.trpc.post.commentCount.queryOptions({ postId: post.id }),
      ),
      context.queryClient.prefetchQuery(
        context.trpc.post.getComments.queryOptions({ postId: post.id }),
      ),
    ])

    if (!contentResult.success) {
      return {
        post,
        content: "",
        contentError: contentResult.error ?? "Failed to load post content",
      }
    }

    return {
      post,
      content: contentResult.content,
      contentError: null,
    }
  },
  component: PostDetailPage,
  notFoundComponent: () => <div className="text-center py-16">Post not found</div>,
})

function PostDetailPage() {
  const { post, content, contentError } = Route.useLoaderData()
  const commentsRef = useRef<HTMLDivElement>(null)
  const trpc = useTRPC()
  const { data: commentCount = 0 } = useQuery({
    ...trpc.post.commentCount.queryOptions({ postId: post.id }),
  })

  const handleCommentClick = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (contentError) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold font-mono">Error loading post</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{contentError}</p>
      </div>
    )
  }

  return (
    <>
      <ReadingProgress />
      <ScrollLines />

      <div className="py-8 max-w-3xl mx-auto relative z-10">
        <div className="space-y-3">
          <BlogPostHeader
            title={post.title}
            date={new Date(post.date)}
            category={post.category}
            postId={post.id}
            readingTimeMinutes={post.readingTimeMinutes ?? undefined}
            tags={post.tags ?? undefined}
            headerImageUrl={post.headerImageUrl}
            likes={post.likesCount}
            commentCount={commentCount}
            onCommentClick={handleCommentClick}
          />
          <BlogPostViewer content={content} />
          <div ref={commentsRef}>
            <BlogComments postId={post.id} />
          </div>
        </div>
      </div>
    </>
  )
}
