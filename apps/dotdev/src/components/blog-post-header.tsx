import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, Bookmark, Heart, MessageCircle, Share2 } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/auth/client"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { trpcClient } from "@/lib/trpc"
import { cn } from "@/lib/utils"

interface BlogPostHeaderProps {
  title: string
  date: Date
  category: string
  postId: string
  readingTimeMinutes?: number
  tags?: string[]
  headerImageUrl?: string
  authorImageUrl?: string
  authorName?: string
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
  authorName = "Dave Dennis",
  likes = 0,
  commentCount = 0,
  onCommentClick,
}: BlogPostHeaderProps) {
  const { data: session } = authClient.useSession()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)
  const [bookmarked, setBookmarked] = useState(false)

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

  const getCategoryStyles = (cat: string) => {
    const styles: Record<string, string> = {
      TIL: "text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/30",
      Blog: "text-indigo-600 dark:text-indigo-400 border-indigo-600/30 dark:border-indigo-400/30 bg-indigo-50 dark:bg-indigo-950/30",
      NixWithMe:
        "text-cyan-600 dark:text-cyan-400 border-cyan-600/30 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-950/30",
      Life: "text-rose-600 dark:text-rose-400 border-rose-600/30 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-950/30",
    }
    return styles[cat] || "text-muted-foreground border-border bg-muted/30"
  }

  return (
    <header className="mb-10">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-mono mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>back to posts</span>
      </Link>

      {/* Hero image */}
      {headerImageUrl && (
        <div className="relative w-full overflow-hidden rounded-xl border border-border mb-8 group">
          <div className="aspect-[21/9]">
            <img
              src={headerImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Category and meta */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-md border font-mono text-xs font-medium",
            getCategoryStyles(category),
          )}
        >
          {category}
        </span>
        <span className="text-sm text-muted-foreground font-mono">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        {readingTimeMinutes && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-sm text-muted-foreground font-mono">
              {readingTimeMinutes} min read
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6 text-balance">
        {title}
      </h1>

      {/* Author and engagement row */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border bg-muted">
            <img
              src={authorImageUrl}
              alt={authorName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium font-mono">{authorName}</p>
            <p className="text-xs text-muted-foreground font-mono">@0xdsqr</p>
          </div>
        </div>

        {/* Engagement buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLike}
                disabled={!session?.user || likeMutation.isPending}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border transition-all font-mono text-sm",
                  liked
                    ? "border-red-500/30 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                    : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground",
                  !session?.user && "opacity-50 cursor-not-allowed",
                )}
              >
                <Heart
                  className="w-4 h-4"
                  fill={liked ? "currentColor" : "none"}
                />
                <span>{likeCount}</span>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onCommentClick}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all font-mono text-sm"
              >
                <MessageCircle className="w-4 h-4" />
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
                onClick={() => setBookmarked(!bookmarked)}
                className={cn(
                  "p-2 rounded-md border transition-all",
                  bookmarked
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground",
                )}
                aria-label="Bookmark post"
              >
                <Bookmark
                  className="w-4 h-4"
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-foreground text-background"
            >
              Bookmark
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(window.location.href)
                }
                className="p-2 rounded-md border border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all"
                aria-label="Share post"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-foreground text-background"
            >
              Share
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono px-2 py-1 rounded border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </header>
  )
}
