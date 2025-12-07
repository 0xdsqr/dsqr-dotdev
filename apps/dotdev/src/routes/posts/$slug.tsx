import type { Post } from "@dsqr-dotdev/db/schema"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense, useRef } from "react"
import { trpcClient } from "@/lib/trpc"
import { BlogComments } from "../../components/blog-comments"
import { BlogPostHeader } from "../../components/blog-post-header"
import { ReadingProgress } from "../../components/reading-progress"
import { ScrollLines } from "../../components/scroll-lines"

// Temporarily commented out
// import {
//   extractHeadingsFromMarkdown,
//   OnThisPage,
// } from "../../components/on-this-page"

const BlogPostViewer = lazy(() =>
  import("../../components/blog-post-viewer").then((mod) => ({
    default: mod.BlogPostViewer,
  })),
)

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
  const commentsRef = useRef<HTMLDivElement>(null)

  useQuery({
    queryKey: ["post.comments", post.id],
    queryFn: () => trpcClient.post.getComments.query({ postId: post.id }),
  })

  const { data: commentCount = 0 } = useQuery({
    queryKey: ["post.commentCount", post.id],
    queryFn: () => trpcClient.post.commentCount.query({ postId: post.id }),
  })

  // Temporarily commented out
  // const headings = useMemo(
  //   () =>
  //     contentResult.success
  //       ? extractHeadingsFromMarkdown(contentResult.content)
  //       : [],
  //   [contentResult],
  // )

  const handleCommentClick = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth" })
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
    <>
      <ReadingProgress />
      <ScrollLines />

      <div className="py-8 max-w-3xl mx-auto relative z-10">
        <div className="space-y-3">
          <BlogPostHeader
            title={post.title}
            date={post.createdAt}
            category={post.category}
            postId={post.id}
            readingTimeMinutes={post.readingTimeMinutes || 0}
            headerImageUrl={post.headerImageUrl || ""}
            tags={post.tags || []}
            likes={post.likesCount}
            commentCount={commentCount}
            onCommentClick={handleCommentClick}
          />
          {/* Temporarily commented out */}
          {/* {isMobile && headings.length > 0 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-sm text-left border border-dotted border-border rounded flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="text-foreground font-medium">
                    On this page
                  </span>
                  <ChevronDown
                    className="w-4 h-4 opacity-50 transition-transform"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <div className="py-2">
                  <OnThisPage headings={headings} />
                </div>
              </PopoverContent>
            </Popover>
          )} */}
          <Suspense
            fallback={
              <div className="text-muted-foreground">Loading post...</div>
            }
          >
            <BlogPostViewer content={contentResult.content} />
          </Suspense>
          <div ref={commentsRef}>
            <BlogComments postId={post.id} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar - Temporarily commented out */}
      {/* {headings.length > 0 && (
        <div className="hidden xl:block fixed right-8 top-24 h-[calc(100vh-6rem)] w-64 overflow-y-auto">
          <OnThisPage headings={headings} />
        </div>
      )} */}
    </>
  )
}
