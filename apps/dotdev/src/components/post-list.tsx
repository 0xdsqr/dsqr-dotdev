import { useState, useEffect } from "react"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import {
  EyeIcon,
  TagIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
} from "lucide-react"

import type { RouterOutputs } from "@dsqr-dotdev/api"

type ApiPost = RouterOutputs["post"]["all"][0]
type SortBy = "date" | "views"

interface PostListProps {
  posts: ApiPost[]
}

interface SearchParams {
  sort?: SortBy
  order?: string
  [key: string]: any
}

function PostList({ posts }: PostListProps) {
  const router = useRouter()

  let search: SearchParams = {}
  try {
    search = useSearch({ from: "/posts" }) as SearchParams
  } catch (error) {
    console.log("Route not matched for search params")
  }

  const [sortAscending, setSortAscending] = useState<boolean>(
    search.order === "asc",
  )
  const [sortBy, setSortBy] = useState<SortBy>(
    search.sort === "views" ? "views" : "date",
  )

  useEffect(() => {
    try {
      const newSearch = {
        ...search,
        sort: sortBy,
        order: sortAscending ? "asc" : "desc",
      }

      Object.keys(newSearch).forEach((key) => {
        const typedKey = key as keyof typeof newSearch
        if (newSearch[typedKey] === undefined) {
          delete newSearch[typedKey]
        }
      })

      router.navigate({
        search: newSearch as any,
        replace: true,
      })
    } catch (error) {
      console.error("Failed to update URL with search params", error)
    }
  }, [sortAscending, sortBy, router])

  const transformedPosts = posts
    .filter((post) => post.published)
    .map((post) => ({
      ...post,
      _id: post.id,
      url: `/posts/${post.slug}`,
      date: post.createdAt.toISOString(),
      views: post.likes,
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
        ? (a.views || 0) - (b.views || 0)
        : (b.views || 0) - (a.views || 0)
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <button
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
          onClick={() => {
            setSortBy("views")
            setSortAscending(sortBy === "views" ? !sortAscending : false)
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <EyeIcon className="w-4 h-4" />
          <span>Views</span>
          {sortBy === "views" &&
            (sortAscending ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            ))}
        </button>
      </div>

      <div className="space-y-4">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <Link key={post._id} to={post.url} className="block group">
              <article className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <h2 className="text-base sm:text-lg font-medium mb-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{post.views !== undefined ? post.views : "–"}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      post.category === "TIL"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : post.category === "Blog"
                          ? "text-indigo-600 dark:text-indigo-400"
                          : post.category === "NixWithMe"
                            ? "text-cyan-600 dark:text-cyan-400"
                            : post.category === "Life"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-gray-600 dark:text-gray-400"
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
    </div>
  )
}

export { PostList }
export type { PostListProps }
