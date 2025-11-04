import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Intro } from "@/components/intro"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { PostList } from "@/components/post-list"
import { useTRPC } from "../lib/trpc"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const trpc = useTRPC()
  const { data: posts } = useSuspenseQuery(trpc.post.all.queryOptions())

  return (
    <div className="space-y-6 mt-12">
      <Intro />
      <NewsletterSignup />
      <div>
        <h2 className="text-lg font-semibold mb-4">posts</h2>
        <PostList posts={posts} />
      </div>
    </div>
  )
}
