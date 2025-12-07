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
    <div className="py-8 space-y-12">
      <Intro />
      <NewsletterSignup />
      <section>
        <h2 className="text-xl font-mono font-bold mb-6 border-b-2 border-dotted border-primary inline-block">
          Recent Posts
        </h2>
        <PostList posts={posts} />
      </section>
    </div>
  )
}
