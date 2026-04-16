import { createFileRoute } from "@tanstack/react-router"
import { PostList } from "@dsqr-dotdev/react/components/post-list"

export const Route = createFileRoute("/posts/")({
  loader: ({ context }) => context.queryClient.fetchQuery(context.trpc.post.all.queryOptions()),
  component: PostsIndexPage,
})

function PostsIndexPage() {
  const posts = Route.useLoaderData()

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-muted-foreground">
          0xdsqr
        </p>
        <h1 className="text-2xl font-bold font-mono border-b-2 border-dotted border-border pb-2 inline-block">
          posts
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Notes, essays, and works in progress. We&apos;re starting simple and bringing the archive
          back carefully.
        </p>
      </div>
      <PostList posts={posts} />
    </div>
  )
}
