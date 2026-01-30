import { Badge } from "@dsqr-dotdev/ui/components/badge"
import { Button } from "@dsqr-dotdev/ui/components/button"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckCircle, Clock, FileText, Plus } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { useTRPC } from "@/lib/trpc"

export const Route = createFileRoute("/_authenticated/blog/")({
  component: BlogPostsPage,
})

function BlogPostsPage() {
  const trpc = useTRPC()
  const { data: posts, isLoading } = useQuery(trpc.post.adminAll.queryOptions())

  return (
    <>
      <SiteHeader
        breadcrumbs={[{ label: "Content", href: "/" }, { label: "Blog" }]}
        actions={
          <Link to="/blog/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your blog content
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-12">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-sm font-medium">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Get started by creating your first blog post.
            </p>
            <Link to="/blog/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="divide-y">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to="/blog/$postId"
                  params={{ postId: post.id }}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium truncate">
                        {post.title}
                      </h3>
                      <Badge
                        variant={post.published ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {post.published ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {post.published ? "published" : "draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        /{post.slug}
                      </span>
                      {post.category && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            &middot;
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {post.category}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">
                        &middot;
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
