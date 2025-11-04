import { useMutation } from "@tanstack/react-query"
import { Heart, MessageCircle } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/auth/client"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { trpcClient } from "@/lib/trpc"

interface BlogPostHeaderProps {
  title: string
  date: Date
  category: string
  postId: string
  readingTimeMinutes?: number
  tags?: string[]
  headerImageUrl?: string
  authorImageUrl?: string
  likes?: number
  commentCount?: number
  onCommentClick?: () => void
}

export function BlogPostHeader({
  title,
  date,
  category,
  postId,
  readingTimeMinutes,
  tags = [],
  headerImageUrl,
  authorImageUrl = "/me.jpeg",
  likes = 0,
  commentCount = 0,
  onCommentClick,
}: BlogPostHeaderProps) {
  const { data: session } = authClient.useSession()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)

  const likeMutation = useMutation({
    mutationFn: (increment: boolean) =>
      trpcClient.post.like.mutate({
        postId,
        increment,
      }),
    onMutate: async (increment: boolean) => {
      const previousLiked = liked
      const previousCount = likeCount

      setLiked(!liked)
      setLikeCount(increment ? likeCount + 1 : Math.max(likeCount - 1, 0))

      return { previousLiked, previousCount }
    },
    onSuccess: () => {},
    onError: (_error, _variables, context) => {
      if (context) {
        setLiked(context.previousLiked)
        setLikeCount(context.previousCount)
      }
    },
  })

  const handleLike = () => {
    if (!session?.user) {
      return
    }
    likeMutation.mutate(!liked)
  }
  return (
    <div className="w-full space-y-4 mb-6">
      {headerImageUrl && (
        <div className="relative w-full overflow-hidden rounded-lg border border-border">
          <img
            src={headerImageUrl}
            alt={title}
            className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
            style={{ aspectRatio: "16/9" }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
        </div>
      )}

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight break-words">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium pt-1">
          <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0 border border-border">
            <img
              src={authorImageUrl}
              alt="Author"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="opacity-50">·</span>

          <div className="flex items-center gap-1.5">
            <span>
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>

            {readingTimeMinutes && (
              <>
                <span className="opacity-50">·</span>
                <span>{readingTimeMinutes} min</span>
              </>
            )}

            <span className="opacity-50">·</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(category)}`}
            >
              {category}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCommentClick}
                  className="flex items-center gap-2 transition-opacity hover:opacity-70 cursor-pointer text-muted-foreground"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{commentCount}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-foreground text-background"
              >
                {commentCount === 0 ? "be first to comment" : "view comments"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={!session?.user || likeMutation.isPending}
                  className={`flex items-center gap-2 transition-opacity ${
                    session?.user
                      ? "hover:opacity-70 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Heart
                    className="w-5 h-5 transition-colors"
                    fill={liked ? "#ef4444" : "none"}
                    stroke={liked ? "#ef4444" : "currentColor"}
                  />
                  <span
                    className={liked ? "text-red-500" : "text-muted-foreground"}
                  >
                    {likeCount}
                  </span>
                </button>
              </TooltipTrigger>
              {!session?.user && (
                <TooltipContent
                  side="bottom"
                  className="bg-foreground text-background"
                >
                  Just sign up bro...
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    TIL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    Blog: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
    NixWithMe: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
    Life: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100",
  }

  return (
    colors[category] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
  )
}
