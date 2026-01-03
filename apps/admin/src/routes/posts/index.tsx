import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Clock, Edit, Eye, FileText, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTRPC } from "@/lib/trpc"

export const Route = createFileRoute("/posts/")({
  component: PostsList,
})

function PostsList() {
  const trpc = useTRPC()
  const { data: posts, isLoading } = useQuery(trpc.post.adminAll.queryOptions())

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-foreground font-semibold">Blog Posts</span>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/posts/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Post
          </Link>
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground font-mono">loading posts...</p>
          </div>
        ) : !posts?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold">No posts yet</h2>
            <p className="text-muted-foreground mt-1">
              Create your first blog post to get started.
            </p>
            <Button asChild className="mt-4">
              <Link to="/posts/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Post
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function PostCard({
  post,
}: {
  post: {
    id: string
    title: string
    slug: string
    description: string
    published: boolean
    createdAt: Date
    updatedAt: Date | null
    viewCount: number
    category: string
  }
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to="/posts/$postId"
            params={{ postId: post.id }}
            className="font-semibold hover:underline truncate"
          >
            {post.title}
          </Link>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              post.published
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {post.published ? "Published" : "Draft"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {post.description}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.viewCount} views
          </span>
          <span className="text-muted-foreground/70">{post.category}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/posts/$postId" params={{ postId: post.id }}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
