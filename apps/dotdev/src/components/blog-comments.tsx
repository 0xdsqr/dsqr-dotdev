"use client"

import type { PostComment } from "@dsqr-dotdev/db/schema"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Reply, Trash2 } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/auth/client"
import { trpcClient } from "@/lib/trpc"

interface BlogCommentsProps {
  postId: string
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const { data: session } = authClient.useSession()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [replyText, setReplyText] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  const { data: comments = [], refetch } = useQuery({
    queryKey: ["post.comments", postId],
    queryFn: () => trpcClient.post.getComments.query({ postId }),
  })

  const createMutation = useMutation({
    mutationFn: (input: { content: string; parentCommentId?: string }) =>
      trpcClient.post.createComment.mutate({
        postId,
        content: input.content,
        parentCommentId: input.parentCommentId,
      }),
    onSuccess: () => {
      setCommentText("")
      setReplyingTo(null)
      setReplyText("")
      refetch()
    },
    onError: (_error) => {},
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      trpcClient.post.deleteComment.mutate({ commentId }),
    onSuccess: () => {
      refetch()
    },
    onError: (_error) => {},
  })

  const handleSubmit = (e: React.FormEvent, parentId?: string) => {
    e.preventDefault()
    const text = parentId ? replyText : commentText
    if (!text.trim()) return

    createMutation.mutate({
      content: text,
      parentCommentId: parentId,
    })
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  return (
    <section className="mt-16 pt-8 border-t border-border space-y-6">
      <h2 className="text-xl font-mono font-bold mb-6 flex items-center gap-2">
        <span className="border-b-2 border-dotted border-primary">
          comments
        </span>
        <span className="text-muted-foreground font-normal">
          ({comments.length})
        </span>
      </h2>

      {session?.user ? (
        <form onSubmit={(e) => handleSubmit(e)} className="mb-8">
          <div className="border border-dashed border-border rounded-lg p-4 focus-within:border-primary/50 transition-colors">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="what are your thoughts..."
              className="w-full bg-transparent resize-none text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none min-h-[80px]"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setCommentText("")}
                className="px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                clear
              </button>
              <button
                type="submit"
                disabled={!commentText.trim() || createMutation.isPending}
                className="px-4 py-2 text-sm font-mono bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {createMutation.isPending ? "posting..." : "post"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground font-mono">
            sign in to leave a comment
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground font-mono">
              no comments yet. be the first to share your thoughts.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postId={postId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending}
              onDelete={deleteMutation.mutate}
              isDeleting={deleteMutation.isPending}
              expandedReplies={expandedReplies}
              toggleReplies={toggleReplies}
            />
          ))
        )}
      </div>
    </section>
  )
}

interface CommentThreadProps {
  comment: PostComment & { replies?: PostComment[] }
  postId: string
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyText: string
  setReplyText: (text: string) => void
  onSubmit: (e: React.FormEvent, parentId?: string) => void
  isSubmitting: boolean
  onDelete: (commentId: string) => void
  isDeleting: boolean
  expandedReplies: Set<string>
  toggleReplies: (id: string) => void
  depth?: number
}

function CommentThread({
  comment,
  postId,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onSubmit,
  isSubmitting,
  onDelete,
  isDeleting,
  expandedReplies,
  toggleReplies,
  depth = 0,
}: CommentThreadProps) {
  const isReply = depth > 0

  return (
    <div
      className={`space-y-3 ${isReply ? "ml-8 border-l-2 border-dashed border-border pl-4" : ""}`}
    >
      <CommentItem
        comment={comment}
        onReply={() =>
          setReplyingTo(replyingTo === comment.id ? null : comment.id)
        }
        onDelete={onDelete}
        isDeleting={isDeleting}
        isReply={isReply}
        isReplying={replyingTo === comment.id}
        expandedReplies={expandedReplies}
        toggleReplies={toggleReplies}
      />

      {replyingTo === comment.id && (
        <div className="ml-6 mt-2 border-l-2 border-dashed border-border pl-4">
          <form
            onSubmit={(e) => {
              onSubmit(e, comment.id)
            }}
          >
            <div className="border border-dashed border-border rounded-lg p-3 focus-within:border-primary/50 transition-colors">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="reply..."
                className="w-full bg-transparent resize-none text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyText("")
                  }}
                  className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSubmitting}
                  className="px-3 py-1.5 text-xs font-mono bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? "posting..." : "reply"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {comment.replies &&
        comment.replies.length > 0 &&
        expandedReplies.has(comment.id) && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                postId={postId}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                onDelete={onDelete}
                isDeleting={isDeleting}
                expandedReplies={expandedReplies}
                toggleReplies={toggleReplies}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
    </div>
  )
}

interface CommentItemProps {
  comment: PostComment
  onReply: () => void
  onDelete: (commentId: string) => void
  isDeleting: boolean
  isReply?: boolean
  isReplying?: boolean
  expandedReplies: Set<string>
  toggleReplies: (id: string) => void
}

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"

function CommentItem({
  comment,
  onReply,
  onDelete,
  isDeleting,
  isReply,
  _isReplying,
  expandedReplies,
  toggleReplies,
}: CommentItemProps) {
  const { data: session } = authClient.useSession()
  const userName = (comment as Record<string, unknown>).userName as
    | string
    | undefined
  const userEmail = (comment as Record<string, unknown>).userEmail as
    | string
    | undefined
  const displayName = userName?.trim?.() || userEmail?.trim?.() || "Anonymous"

  const userImage =
    ((comment as Record<string, unknown>).userImage as string | undefined) ||
    DEFAULT_AVATAR
  const isOwner = session?.user?.id === comment.userId

  const hasReplies = comment.replies && comment.replies.length > 0
  const isExpanded = expandedReplies.has(comment.id)

  return (
    <div>
      <div className="border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-muted">
              <img
                src={userImage}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = DEFAULT_AVATAR
                }}
              />
            </div>
            <div>
              <p className="text-sm font-mono font-medium">{displayName}</p>
              <p className="text-xs font-mono text-muted-foreground">
                {formatDate(new Date(comment.createdAt))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isReply && (
              <button
                type="button"
                onClick={onReply}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                disabled={isDeleting}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm font-mono text-foreground/90 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Show replies toggle */}
        {hasReplies && (
          <button
            type="button"
            onClick={() => toggleReplies(comment.id)}
            className="flex items-center gap-1 mt-3 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>
              {comment.replies?.length}{" "}
              {comment.replies?.length === 1 ? "reply" : "replies"}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}
