import React from "react"
import { Badge } from "@/components/ui/badge"

interface BlogPostHeaderProps {
  title: string
  date: Date
  category: string
  readingTimeMinutes?: number
  tags?: string[]
  headerImageUrl?: string
}

export function BlogPostHeader({
  title,
  date,
  category,
  readingTimeMinutes,
  tags = [],
  headerImageUrl,
}: BlogPostHeaderProps) {
  return (
    <div className="w-full space-y-6 mb-8">
      {/* Header Image */}
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

      {/* Content */}
      <div className="space-y-4">
        {/* Category Badge */}
        <div className="flex w-fit">
          <span
            className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getCategoryColor(category)}`}
          >
            {category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight break-words">
          {title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium pt-2">
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
              <span>{readingTimeMinutes} min read</span>
            </>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
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
