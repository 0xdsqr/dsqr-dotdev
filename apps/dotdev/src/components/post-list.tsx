import type { RouterOutputs } from "@dsqr-dotdev/api"
import { Link } from "@tanstack/react-router"
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Clock,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => {
            setSortBy("date")
            setSortAscending(sortBy === "date" ? !sortAscending : false)
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Date</span>
          {sortBy === "date" &&
            (sortAscending ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            ))}
        </button>
        <button
          type="button"
          onClick={() => {
            setSortBy("title")
            setSortAscending(sortBy === "title" ? !sortAscending : false)
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Title</span>
          {sortBy === "title" &&
            (sortAscending ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            ))}
        </button>
      </div>

      {sortedPosts.length > 0 ? (
        sortedPosts.map((post) => (
          <Link key={post._id} to={post.url} className="block group">
            <article className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <h2 className="text-base sm:text-lg font-medium font-mono mb-2 group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
                {post.readingTimeMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{post.readingTimeMinutes} min read</span>
                  </div>
                )}
                <div
                  className={`flex items-center gap-1 border-b-2 border-dotted ${
                    post.category === "TIL"
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400"
                      : post.category === "Blog"
                        ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
                        : post.category === "NixWithMe"
                          ? "text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400"
                          : post.category === "Life"
                            ? "text-rose-600 dark:text-rose-400 border-rose-600 dark:border-rose-400"
                            : "text-gray-600 dark:text-gray-400 border-gray-600 dark:border-gray-400"
                  }`}
                >
                  <TagIcon className="w-3 h-3 flex-shrink-0" />
                  <span>{post.category}</span>
                </div>
              </div>
            </article>
          </Link>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <span>No posts found.</span>
        </div>
      )}
    </div>
  )
}

export { PostList }
export type { PostListProps }
