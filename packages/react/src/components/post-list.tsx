import type { RouterOutputs } from "@dsqr-dotdev/core/api"
import { Link } from "@tanstack/react-router"
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, Clock, TagIcon } from "lucide-react"
import { useMemo, useState } from "react"

type PostListItem = RouterOutputs["post"]["all"][number]

interface PostListProps {
  posts: PostListItem[]
  limit?: number
  showSortControls?: boolean
}

function PostList({ posts, limit, showSortControls = true }: PostListProps) {
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [sortAscending, setSortAscending] = useState(false)

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return sortAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }

      return sortAscending ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    })
  }, [posts, sortAscending, sortBy])

  const visiblePosts = limit ? sortedPosts.slice(0, limit) : sortedPosts

  const getCategoryStyles = (category: string) => {
    const styles = {
      TIL: "text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/30",
      Blog: "text-indigo-600 dark:text-indigo-400 border-indigo-600/30 dark:border-indigo-400/30 bg-indigo-50 dark:bg-indigo-950/30",
      NixWithMe:
        "text-cyan-600 dark:text-cyan-400 border-cyan-600/30 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-950/30",
      Life: "text-rose-600 dark:text-rose-400 border-rose-600/30 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-950/30",
    }
    return styles[category as keyof typeof styles] || "text-muted-foreground border-border"
  }

  return (
    <div className="space-y-6">
      {showSortControls && visiblePosts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-mono">Sort by:</span>
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
      )}

      {visiblePosts.length > 0 ? (
        <div className="space-y-3">
          {visiblePosts.map((post) => (
            <Link
              key={post.slug}
              to="/posts/$slug"
              params={{ slug: post.slug }}
              className="block group"
            >
              <article className="relative rounded-xl border border-border bg-card p-5 transition-all duration-200 group-hover:border-foreground/20 group-hover:shadow-sm">
                <h2 className="mb-3 text-lg font-semibold font-mono leading-tight transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mb-4 text-sm leading-7 text-muted-foreground">{post.description}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm">
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

                  <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readingTimeMinutes ?? 1} min</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-xs font-medium ${getCategoryStyles(
                      post.category,
                    )}`}
                  >
                    <TagIcon className="w-3 h-3" />
                    {post.category}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 py-16 text-center">
          <p className="font-mono text-muted-foreground">No posts found.</p>
        </div>
      )}
    </div>
  )
}

export { PostList }
export type { PostListProps }
