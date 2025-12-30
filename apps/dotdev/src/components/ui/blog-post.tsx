"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  Clock,
  Copy,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  ZoomIn,
} from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// BLOG POST CONTEXT
// ============================================================================

type BlogPostContextValue = {
  liked: boolean
  setLiked: (liked: boolean) => void
  bookmarked: boolean
  setBookmarked: (bookmarked: boolean) => void
  likeCount: number
  setLikeCount: (count: number) => void
}

const BlogPostContext = React.createContext<BlogPostContextValue | null>(null)

function useBlogPost() {
  const context = React.useContext(BlogPostContext)
  if (!context) {
    throw new Error(
      "Blog post components must be used within a BlogPost provider",
    )
  }
  return context
}

// ============================================================================
// BLOG POST ROOT
// ============================================================================

interface BlogPostProps extends React.HTMLAttributes<HTMLElement> {
  initialLikes?: number
}

const BlogPost = React.forwardRef<HTMLElement, BlogPostProps>(
  ({ className, children, initialLikes = 0, ...props }, ref) => {
    const [liked, setLiked] = React.useState(false)
    const [bookmarked, setBookmarked] = React.useState(false)
    const [likeCount, setLikeCount] = React.useState(initialLikes)

    return (
      <BlogPostContext.Provider
        value={{
          liked,
          setLiked,
          bookmarked,
          setBookmarked,
          likeCount,
          setLikeCount,
        }}
      >
        <article
          ref={ref}
          className={cn("w-full max-w-none", className)}
          {...props}
        >
          {children}
        </article>
      </BlogPostContext.Provider>
    )
  },
)
BlogPost.displayName = "BlogPost"

// ============================================================================
// BLOG POST HEADER
// ============================================================================

const BlogPostHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <header ref={ref} className={cn("mb-10", className)} {...props} />
))
BlogPostHeader.displayName = "BlogPostHeader"

// ============================================================================
// BLOG POST BACK LINK
// ============================================================================

interface BlogPostBackLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean
}

const BlogPostBackLink = React.forwardRef<
  HTMLAnchorElement,
  BlogPostBackLinkProps
>(({ className, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground",
        "font-mono mb-6 transition-colors group",
        className,
      )}
      {...props}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      {children || <span>back to posts</span>}
    </Comp>
  )
})
BlogPostBackLink.displayName = "BlogPostBackLink"

// ============================================================================
// BLOG POST COVER IMAGE
// ============================================================================

interface BlogPostCoverProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: "video" | "wide" | "square"
}

const BlogPostCover = React.forwardRef<HTMLDivElement, BlogPostCoverProps>(
  ({ className, src, alt, aspectRatio = "wide", ...props }, ref) => {
    const aspectClasses = {
      video: "aspect-video",
      wide: "aspect-[21/9]",
      square: "aspect-square",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border mb-8 group",
          className,
        )}
      >
        <div className={aspectClasses[aspectRatio]}>
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            {...props}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
      </div>
    )
  },
)
BlogPostCover.displayName = "BlogPostCover"

// ============================================================================
// BLOG POST META
// ============================================================================

const BlogPostMeta = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap items-center gap-3 mb-4", className)}
    {...props}
  />
))
BlogPostMeta.displayName = "BlogPostMeta"

// ============================================================================
// BLOG POST CATEGORY BADGE
// ============================================================================

const blogPostCategoryVariants = cva(
  "inline-flex items-center px-3 py-1 rounded-md border font-mono text-xs font-medium",
  {
    variants: {
      variant: {
        default: "text-muted-foreground border-border bg-muted/30",
        til: "text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/30",
        blog: "text-indigo-600 dark:text-indigo-400 border-indigo-600/30 dark:border-indigo-400/30 bg-indigo-50 dark:bg-indigo-950/30",
        nixwithme:
          "text-cyan-600 dark:text-cyan-400 border-cyan-600/30 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-950/30",
        life: "text-rose-600 dark:text-rose-400 border-rose-600/30 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-950/30",
        purple:
          "text-purple-600 dark:text-purple-400 border-purple-600/30 dark:border-purple-400/30 bg-purple-50 dark:bg-purple-950/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

interface BlogPostCategoryProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof blogPostCategoryVariants> {}

const BlogPostCategory = React.forwardRef<
  HTMLSpanElement,
  BlogPostCategoryProps
>(({ className, variant, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(blogPostCategoryVariants({ variant }), className)}
    {...props}
  />
))
BlogPostCategory.displayName = "BlogPostCategory"

// ============================================================================
// BLOG POST DATE
// ============================================================================

interface BlogPostDateProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date | string
  showIcon?: boolean
}

const BlogPostDate = React.forwardRef<HTMLSpanElement, BlogPostDateProps>(
  ({ className, date, showIcon = false, ...props }, ref) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const formatted = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return (
      <span
        ref={ref}
        className={cn(
          "text-sm text-muted-foreground font-mono flex items-center gap-1.5",
          className,
        )}
        {...props}
      >
        {showIcon && <Calendar className="w-3.5 h-3.5" />}
        {formatted}
      </span>
    )
  },
)
BlogPostDate.displayName = "BlogPostDate"

// ============================================================================
// BLOG POST READING TIME
// ============================================================================

interface BlogPostReadingTimeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  minutes: number
  showIcon?: boolean
}

const BlogPostReadingTime = React.forwardRef<
  HTMLSpanElement,
  BlogPostReadingTimeProps
>(({ className, minutes, showIcon = false, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground font-mono flex items-center gap-1.5",
      className,
    )}
    {...props}
  >
    {showIcon && <Clock className="w-3.5 h-3.5" />}
    {minutes} min read
  </span>
))
BlogPostReadingTime.displayName = "BlogPostReadingTime"

// ============================================================================
// BLOG POST TITLE
// ============================================================================

const BlogPostTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6 text-balance",
      className,
    )}
    {...props}
  />
))
BlogPostTitle.displayName = "BlogPostTitle"

// ============================================================================
// BLOG POST AUTHOR
// ============================================================================

interface BlogPostAuthorProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  handle?: string
  avatarUrl?: string
}

const BlogPostAuthor = React.forwardRef<HTMLDivElement, BlogPostAuthorProps>(
  ({ className, name, handle, avatarUrl, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border bg-muted">
        <img
          src={avatarUrl || "/placeholder.svg?height=40&width=40"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <p className="text-sm font-medium font-mono">{name}</p>
        {handle && (
          <p className="text-xs text-muted-foreground font-mono">{handle}</p>
        )}
      </div>
    </div>
  ),
)
BlogPostAuthor.displayName = "BlogPostAuthor"

// ============================================================================
// BLOG POST ENGAGEMENT
// ============================================================================

const BlogPostEngagement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border",
      className,
    )}
    {...props}
  />
))
BlogPostEngagement.displayName = "BlogPostEngagement"

// ============================================================================
// BLOG POST ACTIONS
// ============================================================================

const BlogPostActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
))
BlogPostActions.displayName = "BlogPostActions"

// ============================================================================
// BLOG POST LIKE BUTTON
// ============================================================================

const BlogPostLikeButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { liked, setLiked, likeCount, setLikeCount } = useBlogPost()

  const handleClick = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border transition-all font-mono text-sm",
        liked
          ? "border-red-500/30 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
          : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
      <span>{likeCount}</span>
    </button>
  )
})
BlogPostLikeButton.displayName = "BlogPostLikeButton"

// ============================================================================
// BLOG POST COMMENT BUTTON
// ============================================================================

interface BlogPostCommentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number
}

const BlogPostCommentButton = React.forwardRef<
  HTMLButtonElement,
  BlogPostCommentButtonProps
>(({ className, count = 0, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md border border-border",
      "hover:border-foreground/20 text-muted-foreground hover:text-foreground",
      "transition-all font-mono text-sm",
      className,
    )}
    {...props}
  >
    <MessageCircle className="w-4 h-4" />
    <span>{count}</span>
  </button>
))
BlogPostCommentButton.displayName = "BlogPostCommentButton"

// ============================================================================
// BLOG POST BOOKMARK BUTTON
// ============================================================================

const BlogPostBookmarkButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { bookmarked, setBookmarked } = useBlogPost()

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setBookmarked(!bookmarked)}
      className={cn(
        "p-2 rounded-md border transition-all",
        bookmarked
          ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
          : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-label="Bookmark post"
      {...props}
    >
      <Bookmark
        className="w-4 h-4"
        fill={bookmarked ? "currentColor" : "none"}
      />
    </button>
  )
})
BlogPostBookmarkButton.displayName = "BlogPostBookmarkButton"

// ============================================================================
// BLOG POST SHARE BUTTON
// ============================================================================

const BlogPostShareButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={() => navigator.clipboard.writeText(window.location.href)}
    className={cn(
      "p-2 rounded-md border border-border hover:border-foreground/20",
      "text-muted-foreground hover:text-foreground transition-all",
      className,
    )}
    aria-label="Share post"
    {...props}
  >
    <Share2 className="w-4 h-4" />
  </button>
))
BlogPostShareButton.displayName = "BlogPostShareButton"

// ============================================================================
// BLOG POST TAGS
// ============================================================================

const BlogPostTags = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap gap-2 mt-4", className)}
    {...props}
  />
))
BlogPostTags.displayName = "BlogPostTags"

// ============================================================================
// BLOG POST TAG
// ============================================================================

interface BlogPostTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean
}

const BlogPostTag = React.forwardRef<HTMLSpanElement, BlogPostTagProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span"
    return (
      <Comp
        ref={ref}
        className={cn(
          "text-xs font-mono px-2 py-1 rounded border border-dashed border-border",
          "text-muted-foreground hover:text-foreground hover:border-foreground/30",
          "transition-colors cursor-pointer",
          className,
        )}
        {...props}
      />
    )
  },
)
BlogPostTag.displayName = "BlogPostTag"

// ============================================================================
// BLOG POST CONTENT
// ============================================================================

const BlogPostContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "prose prose-neutral dark:prose-invert max-w-none",
      // Headings
      "prose-headings:font-mono prose-headings:tracking-tight",
      "prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border",
      "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4",
      // Paragraphs
      "prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/90",
      // Links
      "prose-a:text-primary prose-a:no-underline prose-a:border-b-2 prose-a:border-dotted prose-a:border-primary/50 hover:prose-a:border-primary prose-a:transition-colors",
      // Lists
      "prose-ul:my-6 prose-li:my-2",
      // Code
      "prose-code:text-sm prose-code:font-mono prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
      // Blockquotes
      "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-mono prose-blockquote:text-muted-foreground",
      // Strong
      "prose-strong:text-foreground prose-strong:font-semibold",
      className,
    )}
    {...props}
  />
))
BlogPostContent.displayName = "BlogPostContent"

// ============================================================================
// BLOG POST CALLOUT
// ============================================================================

const blogPostCalloutVariants = cva(
  "my-6 p-4 rounded-r-lg font-mono text-sm border-l-4",
  {
    variants: {
      variant: {
        note: "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
        tip: "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
        warning:
          "border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
        important:
          "border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-950/20",
        purple:
          "border-purple-500 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/20",
      },
    },
    defaultVariants: {
      variant: "note",
    },
  },
)

const calloutLabelStyles = {
  note: "text-blue-600 dark:text-blue-400",
  tip: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  important: "text-red-600 dark:text-red-400",
  purple: "text-purple-600 dark:text-purple-400",
}

interface BlogPostCalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof blogPostCalloutVariants> {
  label?: string
}

const BlogPostCallout = React.forwardRef<HTMLDivElement, BlogPostCalloutProps>(
  ({ className, variant = "note", label, children, ...props }, ref) => {
    const defaultLabel = variant
      ? variant.charAt(0).toUpperCase() + variant.slice(1)
      : "Note"

    return (
      <div
        ref={ref}
        className={cn(blogPostCalloutVariants({ variant }), className)}
        {...props}
      >
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wider mb-2",
            calloutLabelStyles[variant || "note"],
          )}
        >
          {label || defaultLabel}
        </p>
        <div className="text-foreground/90">{children}</div>
      </div>
    )
  },
)
BlogPostCallout.displayName = "BlogPostCallout"

// ============================================================================
// BLOG POST CODE BLOCK
// ============================================================================

interface BlogPostCodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string
  language?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
}

const BlogPostCodeBlock = React.forwardRef<
  HTMLDivElement,
  BlogPostCodeBlockProps
>(
  (
    {
      className,
      code,
      language,
      showLineNumbers = true,
      highlightLines = [],
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = React.useState(false)
    const lines = React.useMemo(() => code.trim().split("\n"), [code])

    const copyToClipboard = async () => {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "group relative my-6 rounded-lg border border-border overflow-hidden bg-muted/30 transition-colors",
          "hover:border-purple-500/30",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          onClick={copyToClipboard}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-md text-muted-foreground transition-all z-10",
            "opacity-0 group-hover:opacity-100",
            "hover:text-purple-500 hover:bg-purple-500/10 bg-background/80 backdrop-blur-sm border border-border",
            copied && "text-emerald-500 opacity-100",
          )}
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="overflow-x-auto">
          <pre className="py-4 text-sm font-mono leading-relaxed">
            <code>
              {lines.map((line, index) => {
                const lineNumber = index + 1
                const isHighlighted = highlightLines.includes(lineNumber)

                return (
                  <div
                    key={index}
                    className={cn(
                      "px-4 flex",
                      isHighlighted &&
                        "bg-purple-500/10 border-l-2 border-purple-500",
                    )}
                  >
                    {showLineNumbers && (
                      <span
                        className={cn(
                          "w-8 flex-shrink-0 select-none text-right pr-4 tabular-nums",
                          isHighlighted
                            ? "text-purple-500"
                            : "text-muted-foreground/40",
                        )}
                      >
                        {lineNumber}
                      </span>
                    )}
                    <span className="flex-1 text-foreground/90">
                      {line || " "}
                    </span>
                  </div>
                )
              })}
            </code>
          </pre>
        </div>
      </div>
    )
  },
)
BlogPostCodeBlock.displayName = "BlogPostCodeBlock"

// ============================================================================
// BLOG POST IMAGE
// ============================================================================

interface BlogPostImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  caption?: string
  credit?: string
  aspectRatio?: "video" | "square" | "portrait" | "auto"
  zoomable?: boolean
  animated?: boolean
}

const BlogPostImage = React.forwardRef<HTMLElement, BlogPostImageProps>(
  (
    {
      className,
      src,
      alt,
      caption,
      credit,
      aspectRatio = "auto",
      zoomable = true,
      animated = false,
      ...props
    },
    ref,
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(false)
    const [isZoomed, setIsZoomed] = React.useState(false)
    const [isPaused, setIsPaused] = React.useState(false)

    const aspectClasses = {
      video: "aspect-video",
      square: "aspect-square",
      portrait: "aspect-[3/4]",
      auto: "",
    }

    return (
      <>
        <figure ref={ref} className={cn("my-8 group", className)}>
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-border bg-muted/30",
              aspectClasses[aspectRatio],
            )}
          >
            {!isLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}

            <img
              src={src || "/placeholder.svg"}
              alt={alt}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                "group-hover:scale-[1.02]",
                isPaused && "grayscale",
              )}
              onLoad={() => setIsLoaded(true)}
              loading="lazy"
              {...props}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {animated && (
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background transition-colors"
                  aria-label={isPaused ? "Play animation" : "Pause animation"}
                >
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
              )}
              {zoomable && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background transition-colors"
                  aria-label="Zoom image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {(caption || credit) && (
            <figcaption className="mt-3 space-y-1">
              {caption && (
                <p className="text-sm text-muted-foreground font-mono text-center">
                  {caption}
                </p>
              )}
              {credit && (
                <p className="text-xs text-muted-foreground/60 font-mono text-center">
                  {credit}
                </p>
              )}
            </figcaption>
          )}
        </figure>

        {isZoomed && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <img
              src={src || "/placeholder.svg"}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
            {caption && (
              <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground font-mono bg-background/80 px-4 py-2 rounded-md backdrop-blur-sm">
                {caption}
              </p>
            )}
          </div>
        )}
      </>
    )
  },
)
BlogPostImage.displayName = "BlogPostImage"

// ============================================================================
// BLOG POST SEPARATOR
// ============================================================================

const BlogPostSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn("my-12 border-t border-border", className)}
    {...props}
  />
))
BlogPostSeparator.displayName = "BlogPostSeparator"

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BlogPost,
  BlogPostHeader,
  BlogPostBackLink,
  BlogPostCover,
  BlogPostMeta,
  BlogPostCategory,
  BlogPostDate,
  BlogPostReadingTime,
  BlogPostTitle,
  BlogPostAuthor,
  BlogPostEngagement,
  BlogPostActions,
  BlogPostLikeButton,
  BlogPostCommentButton,
  BlogPostBookmarkButton,
  BlogPostShareButton,
  BlogPostTags,
  BlogPostTag,
  BlogPostContent,
  BlogPostCallout,
  BlogPostCodeBlock,
  BlogPostImage,
  BlogPostSeparator,
  useBlogPost,
  blogPostCategoryVariants,
  blogPostCalloutVariants,
}
