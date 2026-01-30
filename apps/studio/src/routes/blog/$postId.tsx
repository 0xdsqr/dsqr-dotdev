import { createFileRoute } from "@tanstack/react-router"
import { useTRPC } from "@/lib/trpc"
import { useQuery } from "@tanstack/react-query"
import { SiteHeader } from "@/components/site-header"
import { BlogEditor } from "@/components/blog-editor"

export const Route = createFileRoute("/blog/$postId")({
  component: EditPostPage,
})

function EditPostPage() {
  const { postId } = Route.useParams()
  const trpc = useTRPC()
  const { data: post, isLoading } = useQuery(
    trpc.post.byId.queryOptions({ id: postId }),
  )

  if (isLoading) {
    return (
      <>
        <SiteHeader
          breadcrumbs={[
            { label: "Content", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "Loading..." },
          ]}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    )
  }

  if (!post) {
    return (
      <>
        <SiteHeader
          breadcrumbs={[
            { label: "Content", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "Not Found" },
          ]}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <h2 className="text-lg font-medium">Post not found</h2>
          <p className="text-sm text-muted-foreground">
            The post you are looking for does not exist.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader
        breadcrumbs={[
          { label: "Content", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />
      <div className="flex flex-1 flex-col p-6">
        <BlogEditor post={post} />
      </div>
    </>
  )
}
