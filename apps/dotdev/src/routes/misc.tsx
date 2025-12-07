import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { BlogPostHeader } from "../components/blog-post-header"

const BlogPostViewer = lazy(() =>
  import("../components/blog-post-viewer").then((mod) => ({
    default: mod.BlogPostViewer,
  })),
)

export const Route = createFileRoute("/misc")({
  loader: async ({ context }) => {
    return context.queryClient.fetchQuery(
      context.trpc.misc.gpgData.queryOptions(),
    )
  },
  component: MiscPage,
})

function MiscPage() {
  const { gpgKey, gpgFingerprint } = Route.useLoaderData() as {
    gpgKey: string
    gpgFingerprint: string
  }

  const content = `\`\`\`
${gpgKey}
\`\`\`

## Fingerprint

\`\`\`
${gpgFingerprint}
\`\`\``

  return (
    <div className="py-8 max-w-3xl mx-auto relative z-10">
      <div className="space-y-3">
        <BlogPostHeader
          title="GPG Key"
          date={new Date()}
          category="misc"
          postId="gpg-key"
          readingTimeMinutes={1}
          headerImageUrl=""
          tags={[]}
          likes={0}
          commentCount={0}
        />
        <Suspense
          fallback={<div className="text-muted-foreground">Loading...</div>}
        >
          <BlogPostViewer content={content} />
        </Suspense>
      </div>
    </div>
  )
}
