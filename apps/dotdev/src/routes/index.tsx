import { createFileRoute } from "@tanstack/react-router"
import { PostList } from "@dsqr-dotdev/react/components/post-list"
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
        <h2 className="text-xl font-mono font-bold mb-6 border-b-2 border-dotted border-primary inline-block">
          Recent Posts
        </h2>
        <PostList posts={posts} limit={3} showSortControls={false} />
      </section>
    </div>
  )
}
