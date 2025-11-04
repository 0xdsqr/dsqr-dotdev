"use client"

import type { PostComment } from "@dsqr-dotdev/db/schema"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
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

  return (
    <div className="space-y-6 mt-8 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-mono font-bold tracking-tight">
          <span className="border-b-2 border-dotted border-border">
            comments
          </span>{" "}
          ({comments.length})
        </h2>
      </div>

      {session?.user ? (
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="space-y-3 border border-dashed border-border p-4 rounded"
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="what are your thoughts..."
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCommentText("")}
              className="px-3 py-1.5 text-xs font-mono border border-border rounded hover:bg-muted transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!commentText.trim() || createMutation.isPending}
              className="px-3 py-1.5 text-xs font-mono bg-primary text-primary-foreground border border-primary rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {createMutation.isPending ? "posting..." : "post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="border border-dashed border-border p-4 rounded text-center">
          <p className="text-sm text-muted-foreground font-mono">
            sign in to leave a comment
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
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
            />
          ))
        )}
      </div>
    </div>
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
  depth = 0,
}: CommentThreadProps) {
  const isReply = depth > 0

  return (
    <div
      className={`space-y-3 ${isReply ? "ml-6 border-l-2 border-dashed border-border pl-4" : ""}`}
    >
      <CommentItem
        comment={comment}
        onReply={() => setReplyingTo(comment.id)}
        onDelete={onDelete}
        isDeleting={isDeleting}
        isReply={isReply}
        isReplying={replyingTo === comment.id}
      />

      {replyingTo === comment.id && (
        <div className="ml-6 space-y-3 border-l-2 border-dashed border-border pl-4">
          <form
            onSubmit={(e) => {
              onSubmit(e, comment.id)
            }}
            className="space-y-2"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="reply..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyText("")
                }}
                className="px-2 py-1 text-xs font-mono border border-border rounded hover:bg-muted transition-colors"
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={!replyText.trim() || isSubmitting}
                className="px-2 py-1 text-xs font-mono bg-primary text-primary-foreground border border-primary rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? "posting..." : "reply"}
              </button>
            </div>
          </form>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
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
}

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"

function CommentItem({
  comment,
  onReply,
  onDelete,
  isDeleting,
  _isReply,
  isReplying,
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
  const userRole = (comment as Record<string, unknown>).userRole
  const userBanned = (comment as Record<string, unknown>).userBanned
  const isOwner = session?.user?.id === comment.userId

  return (
    <div className="border border-border rounded p-4 bg-muted/30 hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0 border border-border flex items-center justify-center">
            <img
              src={userImage}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = DEFAULT_AVATAR
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-foreground">
                {displayName}
              </span>
              {userRole && (
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-muted text-foreground">
                  {userRole}
                </span>
              )}
              {userBanned && (
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                  banned
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {formatDate(new Date(comment.createdAt))}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {!isReplying && (
            <button
              type="button"
              onClick={onReply}
              className="px-2 py-1 text-xs font-mono border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              reply
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete comment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
        {comment.content}
      </p>
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
