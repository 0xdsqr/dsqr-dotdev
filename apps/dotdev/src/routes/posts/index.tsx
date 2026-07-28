import { createFileRoute } from "@tanstack/react-router"
import { Eyebrow } from "@dsqr-dotdev/react/components/eyebrow"
import { PostList } from "@dsqr-dotdev/react/components/post-list"
import { SectionHeading } from "@dsqr-dotdev/react/components/section-heading"

export const Route = createFileRoute("/posts/")({
  loader: ({ context }) => context.queryClient.fetchQuery(context.trpc.post.all.queryOptions()),
  component: PostsIndexPage,
})

function PostsIndexPage() {
  const posts = Route.useLoaderData()

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Eyebrow>0xdsqr</Eyebrow>
        <SectionHeading as="h1">posts</SectionHeading>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Notes, essays, and works in progress. I&apos;m starting simple and bringing the archive
          back carefully.
        </p>
      </div>
      <PostList posts={posts} />
    </div>
  )
}
