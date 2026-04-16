import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, Heart, Link2, MessageCircle } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/auth/client"
import { trpcClient } from "@/lib/trpc"
import { cn } from "@/lib/utils"

interface BlogPostHeaderProps {
  title: string
  date: Date
  category: string
  postId: string
  readingTimeMinutes?: number
  tags?: string[]
  headerImageUrl?: string | null
  likes?: number
  commentCount?: number
  onCommentClick?: () => void
}

function copyPostUrl() {
  if (typeof window === "undefined") {
    return Promise.resolve(false)
  }

  const value = window.location.href

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(value)
      .then(() => true)
      .catch(() => false)
  }

  return Promise.resolve(false)
}

export function BlogPostHeader({
  title,
  date,
  category,
  postId,
  readingTimeMinutes,
  tags = [],
  headerImageUrl,
  likes = 0,
  commentCount = 0,
  onCommentClick,
}: BlogPostHeaderProps) {
  const { data: session } = authClient.useSession()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)
  const [linkCopied, setLinkCopied] = useState(false)

  const likeMutation = useMutation({
    mutationFn: (increment: boolean) =>
      trpcClient.post.like.mutate({
        postId,
        increment,
      }),
    onMutate: async (increment) => {
      const previousLiked = liked
      const previousLikeCount = likeCount

      setLiked(increment)
      setLikeCount((current) => (increment ? current + 1 : Math.max(current - 1, 0)))

      return { previousLiked, previousLikeCount }
    },
    onError: (_error, _increment, context) => {
      if (!context) {
        return
      }

      setLiked(context.previousLiked)
      setLikeCount(context.previousLikeCount)
    },
  })

  return (
    <header className="mb-10">
      <Link
        to="/posts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-mono mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>back to posts</span>
      </Link>

      {headerImageUrl ? (
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/80 bg-card">
          <img
            src={headerImageUrl}
            alt={title}
            loading="eager"
            decoding="async"
            className="aspect-[16/7] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
        <span>{category}</span>
        <span className="text-muted-foreground/40">/</span>
        <span>
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        {readingTimeMinutes ? (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span>{readingTimeMinutes} min read</span>
          </>
        ) : null}
      </div>

      <h1 className="mb-6 text-3xl font-semibold leading-tight tracking-tight text-balance md:text-4xl lg:text-[2.8rem]">
        {title}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-5">
        <div className="flex items-center gap-3">
          <img
            src="/me.jpeg"
            alt="Dave Dennis"
            loading="lazy"
            decoding="async"
            className="size-10 rounded-full border border-border object-cover"
          />
          <div>
            <p className="text-sm font-medium font-mono">Dave Dennis</p>
            <p className="text-xs font-mono text-muted-foreground">engineering notes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!session?.user || likeMutation.isPending) {
                return
              }

              likeMutation.mutate(!liked)
            }}
            disabled={!session?.user || likeMutation.isPending}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-sm transition-colors",
              liked
                ? "border-red-500/30 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              !session?.user && "cursor-not-allowed opacity-60",
            )}
            title={session?.user ? "Like post" : "Sign in to like"}
          >
            <Heart className="size-4" fill={liked ? "currentColor" : "none"} />
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={onCommentClick}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            title={commentCount === 0 ? "Be first to comment" : "Jump to comments"}
          >
            <MessageCircle className="size-4" />
            <span>{commentCount}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void copyPostUrl().then((copied) => {
                if (!copied) {
                  return
                }

                setLinkCopied(true)
                window.setTimeout(() => setLinkCopied(false), 1500)
              })
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            title={linkCopied ? "Link copied" : "Copy link"}
          >
            <Link2 className="size-4" />
            <span>{linkCopied ? "copied" : "share"}</span>
          </button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-dashed border-border px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  )
}
