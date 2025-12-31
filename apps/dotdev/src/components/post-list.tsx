import type { RouterOutputs } from "@dsqr-dotdev/api"
import { Link } from "@tanstack/react-router"
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Clock,
  Heart,
  MessageCircle,
  TagIcon,
} from "lucide-react"
import { useState } from "react"

type ApiPost = RouterOutputs["post"]["all"][0]

interface PostListProps {
  posts: ApiPost[]
}

function PostList({ posts }: PostListProps) {
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [sortAscending, setSortAscending] = useState(false)

  const transformedPosts = posts
    .filter((post) => post.published)
    .map((post) => ({
      ...post,
      _id: post.id,
      url: `/posts/${post.slug}`,
      date: post.createdAt.toISOString(),
      likes: post.likesCount,
      comments: post.commentCount ?? 0,
    }))

  const sortedPosts = [...transformedPosts].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return sortAscending
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime()
    } else {
      return sortAscending
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    }
  })

  const getCategoryStyles = (category: string) => {
    const styles = {
      TIL: "text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/30",
      Blog: "text-indigo-600 dark:text-indigo-400 border-indigo-600/30 dark:border-indigo-400/30 bg-indigo-50 dark:bg-indigo-950/30",
      NixWithMe:
        "text-cyan-600 dark:text-cyan-400 border-cyan-600/30 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-950/30",
      Life: "text-rose-600 dark:text-rose-400 border-rose-600/30 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-950/30",
    }
    return (
      styles[category as keyof typeof styles] ||
      "text-muted-foreground border-border"
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-mono">
          Sort by:
        </span>
        <button
          type="button"
          onClick={() => {
            setSortBy("date")
            setSortAscending(sortBy === "date" ? !sortAscending : false)
          }}
          className={`flex items-center gap-1.5 text-sm font-mono transition-all ${
            sortBy === "date"
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Date</span>
          {sortBy === "date" &&
            (sortAscending ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            ))}
        </button>
        <span className="text-muted-foreground/40">•</span>
        <button
          type="button"
          onClick={() => {
            setSortBy("title")
            setSortAscending(sortBy === "title" ? !sortAscending : false)
          }}
          className={`flex items-center gap-1.5 text-sm font-mono transition-all ${
            sortBy === "title"
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Title</span>
          {sortBy === "title" &&
            (sortAscending ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            ))}
        </button>
      </div>

      {/* Posts Grid */}
      {sortedPosts.length > 0 ? (
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <Link key={post._id} to={post.url} className="block group">
              <article className="relative p-5 rounded-xl border border-border bg-card transition-all duration-200 group-hover:border-foreground/20 group-hover:shadow-sm">
                {/* Title */}
                <h2 className="text-lg font-semibold font-mono mb-3 group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </h2>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm">
                  {/* Date */}
                  <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>

                  {/* Reading Time */}
                  {post.readingTimeMinutes && (
                    <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readingTimeMinutes} min</span>
                    </span>
                  )}

                  {/* Category Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-mono text-xs font-medium ${getCategoryStyles(
                      post.category,
                    )}`}
                  >
                    <TagIcon className="w-3 h-3" />
                    {post.category}
                  </span>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-3 ml-auto">
                    {post.likes !== undefined && post.likes > 0 && (
                      <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{post.likes}</span>
                      </span>
                    )}
                    {post.comments !== undefined && post.comments > 0 && (
                      <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.comments}</span>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground font-mono">No posts found.</p>
        </div>
      )}
    </div>
  )
}

export { PostList }
export type { PostListProps }
