import { createFileRoute } from "@tanstack/react-router"
import { PostList } from "@dsqr-dotdev/react/components/post-list"
import { SectionHeading } from "@dsqr-dotdev/react/components/section-heading"
import { Intro } from "@/components/intro"

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.fetchQuery(context.trpc.post.all.queryOptions()),
  component: App,
})

function App() {
  const posts = Route.useLoaderData()

  return (
    <div className="py-8 space-y-12">
      <Intro />
      <section>
        <SectionHeading className="mb-6">Recent Posts</SectionHeading>
        <PostList posts={posts} limit={3} />
      </section>
    </div>
  )
}
