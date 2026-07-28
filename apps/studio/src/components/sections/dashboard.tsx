import { useMemo } from "react"
import type { AdminPost, AdminSubscriber, AdminUser } from "../../lib/studio"
import { normalizeRole } from "../../lib/studio"
import { MetricCard } from "../studio-ui"

export function DashboardSection({
  posts,
  users,
  subscribers,
}: {
  posts: AdminPost[]
  users: AdminUser[]
  subscribers: AdminSubscriber[]
}) {
  const metrics = useMemo(() => {
    const publishedPosts = posts.filter((post) => post.published).length
    const draftPosts = posts.length - publishedPosts
    const totalLikes = posts.reduce((sum, post) => sum + (post.likesCount ?? 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + (post.commentCount ?? 0), 0)
    const adminUsers = users.filter((user) => normalizeRole(user.role) === "admin").length
    const activeSubscribers = subscribers.filter((subscriber) => subscriber.active).length

    return { publishedPosts, draftPosts, totalLikes, totalComments, adminUsers, activeSubscribers }
  }, [posts, subscribers, users])

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <MetricCard label="published posts" value={metrics.publishedPosts} />
      <MetricCard label="draft posts" value={metrics.draftPosts} />
      <MetricCard label="likes" value={metrics.totalLikes} />
      <MetricCard label="comments" value={metrics.totalComments} />
      <MetricCard label="admin users" value={metrics.adminUsers} />
      <MetricCard label="subscribers" value={metrics.activeSubscribers} />
    </div>
  )
}
