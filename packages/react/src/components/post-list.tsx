import type { RouterOutputs } from "@dsqr-dotdev/api"
import { Link } from "@tanstack/react-router"
import { CalendarIcon, Clock, TagIcon } from "lucide-react"
import { useMemo } from "react"

type PostListItem = RouterOutputs["post"]["all"][number]

interface PostListProps {
  posts: PostListItem[]
  limit?: number
}

function PostList({ posts, limit }: PostListProps) {
  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [posts],
  )

  const visiblePosts = limit ? sortedPosts.slice(0, limit) : sortedPosts

  if (visiblePosts.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-mono text-muted-foreground">No posts found.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-dotted divide-border">
      {visiblePosts.map((post) => (
        <Link
          key={post.slug}
          to="/posts/$slug"
          params={{ slug: post.slug }}
          className="group block py-6 first:pt-0"
        >
          <article>
            <h2 className="font-mono text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
              {post.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{post.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{post.readingTimeMinutes ?? 1} min</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded border border-dotted border-border px-2 py-0.5">
                <TagIcon className="h-3 w-3" />
                {post.category}
              </span>
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}

export { PostList }
export type { PostListProps }
