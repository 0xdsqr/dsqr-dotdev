import type { RouterOutputs } from "@dsqr-dotdev/api"
import { Badge } from "@dsqr-dotdev/react/components/ui/badge"
import { BlogPostViewer } from "@dsqr-dotdev/react/components/blog-post-viewer"
import { Button } from "@dsqr-dotdev/react/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@dsqr-dotdev/react/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsqr-dotdev/react/components/ui/card"
import { DataTable } from "@dsqr-dotdev/react/components/data-table"
import { Input } from "@dsqr-dotdev/react/components/ui/input"
import { Label } from "@dsqr-dotdev/react/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@dsqr-dotdev/react/components/ui/select"
import { Separator } from "@dsqr-dotdev/react/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@dsqr-dotdev/react/components/ui/sidebar"
import { Switch } from "@dsqr-dotdev/react/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dsqr-dotdev/react/components/ui/tabs"
import { Textarea } from "@dsqr-dotdev/react/components/ui/textarea"
import { useMutation } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowUpDown,
  BarChart3,
  Eye,
  ExternalLink,
  FilePenLine,
  LayoutDashboard,
  LoaderCircle,
  Mailbox,
  PenLine,
  Plus,
  Search,
  Save,
  Trash2,
  Upload,
  UserCog,
  Users,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ThemeSwitcher } from "@dsqr-dotdev/react/components/theme-switcher"
import { ThemeToggle } from "@dsqr-dotdev/react/components/theme-toggle"
import { authClient } from "../auth/client"
import { getAdminSessionUser } from "../lib/admin-access"
import { getAdminBootstrap } from "../lib/admin-data"
import { getDotdevBaseUrl } from "../lib/runtime-url"
import { trpcClient } from "../lib/trpc"

type SectionId = "dashboard" | "posts" | "users" | "subscribers"
type AdminPost = RouterOutputs["post"]["adminAll"][number]
type AdminUser = RouterOutputs["auth"]["adminUsers"][number]
type AdminSubscriber = RouterOutputs["email"]["adminSubscribers"][number]

type PostEditorState = {
  title: string
  slug: string
  category: string
  description: string
  published: boolean
  date: string
  tags: string
  headerImageUrl: string
  content: string
}

const sectionItems: Array<{
  id: SectionId
  label: string
  description: string
  icon: typeof BarChart3
}> = [
  { id: "dashboard", label: "dashboard", description: "status + activity", icon: LayoutDashboard },
  { id: "posts", label: "posts", description: "manage content", icon: FilePenLine },
  { id: "users", label: "users", description: "roles + access", icon: Users },
  { id: "subscribers", label: "subscribers", description: "email list", icon: Mailbox },
]

export const Route = createFileRoute("/")({
  loader: async () => {
    const adminUser = await getAdminSessionUser()

    if (!adminUser) {
      throw redirect({ to: "/login" })
    }

    return getAdminBootstrap()
  },
  component: StudioPage,
})

function StudioPage() {
  const loaderData = Route.useLoaderData()
  const dotdevBaseUrl = getDotdevBaseUrl()
  const [activeSection, setActiveSection] = useState<SectionId>("posts")
  const [posts, setPosts] = useState<AdminPost[]>(loaderData.posts)
  const [users, setUsers] = useState<AdminUser[]>(loaderData.users)
  const [subscribers] = useState<AdminSubscriber[]>(loaderData.subscribers)
  const [postQuery, setPostQuery] = useState("")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    loaderData.posts[0]?.id ?? null,
  )
  const [editorState, setEditorState] = useState<PostEditorState>(() =>
    createEditorState(loaderData.posts[0] ?? null),
  )
  const [editorView, setEditorView] = useState<"write" | "preview">("write")
  const [contentDirty, setContentDirty] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const activeSectionItem =
    sectionItems.find((item) => item.id === activeSection) ?? sectionItems[0]
  const filteredPosts = useMemo(() => {
    const normalizedQuery = postQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return posts
    }

    return posts.filter((post) => {
      const haystack = [post.title, post.slug, post.category, ...(post.tags ?? [])]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [postQuery, posts])

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  )

  useEffect(() => {
    if (!selectedPost) {
      setEditorState(createEditorState(null))
      return
    }

    let cancelled = false

    setEditorState(createEditorState(selectedPost))
    setEditorView("write")
    setContentDirty(false)

    void trpcClient.post.content
      .query({
        postId: selectedPost.id,
        filePath: selectedPost.filePath ?? undefined,
      })
      .then((result) => {
        if (!result.success || cancelled) {
          return
        }

        setEditorState((current) => {
          if (current.slug !== selectedPost.slug) {
            return current
          }

          return {
            ...current,
            content: result.content,
          }
        })
      })

    return () => {
      cancelled = true
    }
  }, [selectedPost])

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const now = new Date()
      return trpcClient.post.create.mutate({
        title: "Untitled post",
        slug: `untitled-${now.getTime()}`,
        date: now,
        category: "Blog",
        description: "New draft post.",
        published: false,
        tags: [],
        likesCount: 0,
      })
    },
    onSuccess: (post) => {
      const nextPost = {
        ...post,
        commentCount: 0,
      } as AdminPost

      setPosts((current) => [nextPost, ...current])
      setSelectedPostId(post.id)
      setActiveSection("posts")
      setStatusMessage("New draft created.")
      toast.success("New draft created.")
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to create draft.")
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const savePostMutation = useMutation({
    mutationFn: async ({ post, published }: { post: AdminPost; published: boolean }) => {
      const tags = parseTagList(editorState.tags)
      const readingTimeMinutes = estimateReadingTime(editorState.content)
      const normalizedSlug = slugify(editorState.slug || editorState.title)

      await trpcClient.post.update.mutate({
        id: post.id,
        data: {
          title: editorState.title.trim(),
          slug: normalizedSlug,
          category: editorState.category.trim(),
          description: editorState.description.trim(),
          published,
          date: new Date(editorState.date),
          tags,
          headerImageUrl: editorState.headerImageUrl.trim() || undefined,
          readingTimeMinutes,
        },
      })

      const savedContent = await trpcClient.post.saveContent.mutate({
        id: post.id,
        slug: normalizedSlug,
        content: editorState.content,
      })

      return {
        normalizedSlug,
        tags,
        readingTimeMinutes,
        filePath: savedContent.filePath,
        published,
      }
    },
    onSuccess: (result, request) => {
      setPosts((current) =>
        current.map((entry) =>
          entry.id === request.post.id
            ? {
                ...entry,
                title: editorState.title.trim(),
                slug: result.normalizedSlug,
                category: editorState.category.trim(),
                description: editorState.description.trim(),
                published: result.published,
                date: new Date(editorState.date),
                tags: result.tags,
                headerImageUrl: editorState.headerImageUrl.trim() || null,
                readingTimeMinutes: result.readingTimeMinutes,
                filePath: result.filePath,
                updatedAt: new Date(),
              }
            : entry,
        ),
      )
      setEditorState((current) => ({
        ...current,
        published: result.published,
        slug: result.normalizedSlug,
      }))
      setContentDirty(false)
      const message = result.published ? "Post published." : "Draft saved."
      setStatusMessage(message)
      toast.success(message)
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to save post.")
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => trpcClient.post.delete.mutate({ id: postId }),
    onSuccess: (_, postId) => {
      const remainingPosts = posts.filter((post) => post.id !== postId)
      setPosts(remainingPosts)
      setSelectedPostId(remainingPosts[0]?.id ?? null)
      setStatusMessage("Post deleted.")
      toast.success("Post deleted.")
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to delete post.")
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const uploadHeroMutation = useMutation({
    mutationFn: async ({ post, file }: { post: AdminPost; file: File }) => {
      const fileData = await readFileAsBase64(file)
      return trpcClient.post.uploadImage.mutate({
        slug: slugify(editorState.slug || post.slug || post.title),
        fileName: file.name,
        fileType: file.type,
        fileData,
      })
    },
    onSuccess: (result) => {
      setEditorState((current) => ({
        ...current,
        headerImageUrl: result.url,
      }))
      setStatusMessage("Hero image uploaded. Save the post to keep it.")
      toast.success("Hero image uploaded.")
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to upload hero image.")
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      trpcClient.auth.updateUserRole.mutate({ userId, role }),
    onSuccess: (result) => {
      setUsers((current) =>
        current.map((entry) =>
          entry.id === result.id
            ? {
                ...entry,
                role: result.role,
                updatedAt: result.updatedAt,
              }
            : entry,
        ),
      )
      setStatusMessage("User role updated.")
      toast.success("User role updated.")
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to update user role.")
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const metrics = useMemo(() => {
    const publishedPosts = posts.filter((post) => post.published).length
    const draftPosts = posts.length - publishedPosts
    const totalLikes = posts.reduce((sum, post) => sum + (post.likesCount ?? 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + (post.commentCount ?? 0), 0)
    const adminUsers = users.filter((user) => normalizeRole(user.role) === "admin").length
    const activeSubscribers = subscribers.filter((subscriber) => subscriber.active).length

    return { publishedPosts, draftPosts, totalLikes, totalComments, adminUsers, activeSubscribers }
  }, [posts, subscribers, users])
  const previewContent = useMemo(
    () => absolutizeStudioPreviewContent(editorState.content, dotdevBaseUrl),
    [dotdevBaseUrl, editorState.content],
  )
  const previewHeroUrl = editorState.headerImageUrl
    ? absolutizeStudioAssetUrl(editorState.headerImageUrl, dotdevBaseUrl)
    : ""

  const saveAsDraft = () => {
    if (!selectedPost) {
      return
    }

    savePostMutation.mutate({
      post: selectedPost,
      published: false,
    })
  }

  const publishPost = () => {
    if (!selectedPost) {
      return
    }

    savePostMutation.mutate({
      post: selectedPost,
      published: true,
    })
  }

  const userColumns = useMemo<Array<ColumnDef<AdminUser>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <TableHeaderButton
            label="name"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.name || "—"}</span>,
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <TableHeaderButton
            label="email"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.email}</span>,
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <TableHeaderButton
            label="role"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => {
          const user = row.original

          return (
            <Select
              value={normalizeRole(user.role)}
              onValueChange={(value) => {
                if (!value) {
                  return
                }

                setUsers((current) =>
                  current.map((entry) =>
                    entry.id === user.id ? { ...entry, role: value } : entry,
                  ),
                )
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="user">user</SelectItem>
              </SelectContent>
            </Select>
          )
        },
      },
      {
        accessorKey: "emailVerified",
        header: ({ column }) => (
          <TableHeaderButton
            label="verified"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.emailVerified ? "default" : "secondary"}>
            {row.original.emailVerified ? "verified" : "pending"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <TableHeaderButton
            label="created"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="font-mono"
              disabled={updateUserRoleMutation.isPending}
              onClick={() =>
                updateUserRoleMutation.mutate({
                  userId: row.original.id,
                  role: normalizeRole(row.original.role),
                })
              }
            >
              <UserCog className="size-4" />
              save role
            </Button>
          </div>
        ),
      },
    ],
    [updateUserRoleMutation],
  )

  const subscriberColumns = useMemo<Array<ColumnDef<AdminSubscriber>>>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => (
          <TableHeaderButton
            label="email"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.email}</span>,
      },
      {
        accessorKey: "active",
        header: ({ column }) => (
          <TableHeaderButton
            label="status"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.active ? "default" : "secondary"}>
            {row.original.active ? "active" : "inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "subscribedAt",
        header: ({ column }) => (
          <TableHeaderButton
            label="subscribed"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.subscribedAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        accessorKey: "unsubscribedAt",
        header: ({ column }) => (
          <TableHeaderButton
            label="unsubscribed"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.unsubscribedAt
              ? formatDistanceToNow(new Date(row.original.unsubscribedAt), { addSuffix: true })
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "unsubscribeToken",
        header: ({ column }) => (
          <TableHeaderButton
            label="token"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.unsubscribeToken.slice(0, 10)}...
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-4 border-b border-sidebar-border px-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="px-2" tooltip="studio">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-600/20">
                  <span className="font-mono text-sm font-semibold">A</span>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-mono text-sm font-semibold">studio</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    studio.dsqr.dev
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sectionItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeSection === item.id}
                        tooltip={item.label}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <Icon className="size-4" />
                        <div className="grid flex-1 text-left leading-tight">
                          <span>{item.label}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs font-mono text-muted-foreground">
                <span className="block truncate text-foreground">{loaderData.adminUser.email}</span>
                <span>admin access</span>
              </div>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full font-mono"
              onClick={async () => {
                await authClient.signOut()
                window.location.href = "/login"
              }}
            >
              sign out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <div className="flex min-h-screen flex-col">
          <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <div className="space-y-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      studio
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-mono text-sm lowercase">
                      {activeSectionItem.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <p className="text-sm text-muted-foreground">{activeSectionItem.description}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitcher />
              {statusMessage ? (
                <p className="text-xs font-mono text-muted-foreground">{statusMessage}</p>
              ) : null}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            {activeSection === "dashboard" ? <DashboardSection metrics={metrics} /> : null}

            {activeSection === "posts" ? (
              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <Card className="h-fit overflow-hidden">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="font-mono text-lg">post library</CardTitle>
                        <CardDescription>
                          Drafts, published notes, and quick access.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        className="font-mono"
                        onClick={() => createPostMutation.mutate()}
                        disabled={createPostMutation.isPending}
                      >
                        {createPostMutation.isPending ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                        new
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={postQuery}
                        onChange={(event) => setPostQuery(event.target.value)}
                        placeholder="Find a post"
                        className="h-9 pl-8"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      Write in markdown, flip to preview, then save as a draft or publish live.
                    </div>
                    {filteredPosts.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => setSelectedPostId(post.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          selectedPostId === post.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-foreground/15 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="line-clamp-2 font-medium text-sm">{post.title}</p>
                            <p className="text-xs font-mono text-muted-foreground">{post.slug}</p>
                          </div>
                          <Badge variant={post.published ? "default" : "secondary"}>
                            {post.published ? "published" : "draft"}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                          <span>{post.likesCount} likes</span>
                          <span>{post.commentCount} comments</span>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="space-y-4 border-b border-border bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="font-mono text-lg">editor</CardTitle>
                        <CardDescription>
                          {selectedPost
                            ? "Manage metadata, hero media, markdown, and publish state."
                            : "Select a post to begin editing."}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={editorState.published ? "default" : "secondary"}>
                          {editorState.published ? "published" : "draft"}
                        </Badge>
                        {selectedPost?.slug && editorState.published ? (
                          <a
                            href={`https://dsqr.dev/posts/${selectedPost.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground transition-colors hover:text-foreground"
                          >
                            open live
                            <ExternalLink className="size-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {selectedPost ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-mono text-sm font-semibold">editor workflow</p>
                          <p className="text-sm text-muted-foreground">
                            Write in markdown, switch to preview to review the rendered post, then
                            save as a private draft or publish it live.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
                            editor mode
                          </p>
                          <Tabs
                            value={editorView}
                            onValueChange={(value) => setEditorView(value as "write" | "preview")}
                            className="gap-0"
                          >
                            <TabsList>
                              <TabsTrigger
                                value="write"
                                className="gap-2 font-mono text-xs uppercase tracking-[0.16em]"
                              >
                                <PenLine className="size-4" />
                                write
                              </TabsTrigger>
                              <TabsTrigger
                                value="preview"
                                className="gap-2 font-mono text-xs uppercase tracking-[0.16em]"
                              >
                                <Eye className="size-4" />
                                preview
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    {selectedPost ? (
                      <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Title">
                            <Input
                              value={editorState.title}
                              onChange={(event) =>
                                setEditorState((current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))
                              }
                            />
                          </Field>
                          <Field label="Slug">
                            <Input
                              value={editorState.slug}
                              onChange={(event) =>
                                setEditorState((current) => ({
                                  ...current,
                                  slug: event.target.value,
                                }))
                              }
                            />
                          </Field>
                          <Field label="Category">
                            <Input
                              value={editorState.category}
                              onChange={(event) =>
                                setEditorState((current) => ({
                                  ...current,
                                  category: event.target.value,
                                }))
                              }
                            />
                          </Field>
                          <Field label="Publish date">
                            <Input
                              type="date"
                              value={editorState.date}
                              onChange={(event) =>
                                setEditorState((current) => ({
                                  ...current,
                                  date: event.target.value,
                                }))
                              }
                            />
                          </Field>
                        </div>

                        <Field label="Description">
                          <Textarea
                            rows={3}
                            value={editorState.description}
                            onChange={(event) =>
                              setEditorState((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                          />
                        </Field>

                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                          <Field label="Tags">
                            <Input
                              value={editorState.tags}
                              onChange={(event) =>
                                setEditorState((current) => ({
                                  ...current,
                                  tags: event.target.value,
                                }))
                              }
                              placeholder="aws, distributed-systems, reliability"
                            />
                          </Field>
                          <Field label="Visibility">
                            <div className="flex h-10 items-center justify-between rounded-md border border-input px-3">
                              <span className="text-sm text-muted-foreground">
                                {editorState.published
                                  ? "published to dsqr.dev"
                                  : "kept private as draft"}
                              </span>
                              <Switch
                                checked={editorState.published}
                                onCheckedChange={(checked) =>
                                  setEditorState((current) => ({ ...current, published: checked }))
                                }
                              />
                            </div>
                          </Field>
                        </div>

                        <Field label="Hero image URL">
                          <div className="space-y-3">
                            <Input
                              value={editorState.headerImageUrl}
                              onChange={(event) =>
                                setEditorState((current) => ({
                                  ...current,
                                  headerImageUrl: event.target.value,
                                }))
                              }
                              placeholder="/api/posts/hello-world/images/example.png"
                            />
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-mono text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
                                <Upload className="size-4" />
                                upload hero
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    if (!file || !selectedPost) {
                                      return
                                    }

                                    uploadHeroMutation.mutate({ post: selectedPost, file })
                                    event.target.value = ""
                                  }}
                                />
                              </label>
                              {uploadHeroMutation.isPending ? (
                                <span className="text-xs font-mono text-muted-foreground">
                                  uploading...
                                </span>
                              ) : null}
                            </div>
                            {previewHeroUrl ? (
                              <img
                                src={previewHeroUrl}
                                alt={editorState.title}
                                className="aspect-[16/7] w-full rounded-xl border border-border object-cover"
                              />
                            ) : null}
                          </div>
                        </Field>

                        <Field label="Content">
                          <div className="space-y-4">
                            <Tabs value={editorView} className="gap-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
                                  {editorView === "write"
                                    ? "Markdown editor"
                                    : "Rendered blog preview"}
                                </p>
                              </div>
                              <TabsContent value="write" className="mt-0">
                                <Textarea
                                  rows={24}
                                  value={editorState.content}
                                  onChange={(event) => {
                                    setEditorState((current) => ({
                                      ...current,
                                      content: event.target.value,
                                    }))
                                    setContentDirty(true)
                                  }}
                                  className="min-h-[34rem] font-mono text-sm leading-7"
                                />
                              </TabsContent>

                              <TabsContent value="preview" className="mt-0">
                                <div className="min-h-[34rem] rounded-xl border border-border bg-card/40 p-5 md:p-6">
                                  <p className="mb-6 text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
                                    Rendered markdown preview
                                  </p>
                                  <BlogPostViewer content={previewContent} />
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </Field>

                        <div className="grid gap-4 md:grid-cols-4">
                          <MetricCard label="likes" value={selectedPost.likesCount} />
                          <MetricCard label="comments" value={selectedPost.commentCount} />
                          <MetricCard label="views" value={selectedPost.viewCount} />
                          <MetricCard
                            label="reading time"
                            value={estimateReadingTime(editorState.content)}
                            suffix="min"
                          />
                        </div>

                        <Separator />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs font-mono text-muted-foreground">
                            {contentDirty
                              ? "Unsaved content changes."
                              : "All changes saved locally."}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              variant="outline"
                              className="font-mono"
                              disabled={deletePostMutation.isPending}
                              onClick={() => {
                                if (!selectedPost) {
                                  return
                                }

                                const confirmed = window.confirm(
                                  `Delete "${selectedPost.title}"? This cannot be undone.`,
                                )

                                if (!confirmed) {
                                  return
                                }

                                deletePostMutation.mutate(selectedPost.id)
                              }}
                            >
                              <Trash2 className="size-4" />
                              delete
                            </Button>
                            <Button
                              variant="outline"
                              className="font-mono"
                              disabled={savePostMutation.isPending}
                              onClick={saveAsDraft}
                            >
                              {savePostMutation.isPending && !editorState.published ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <Save className="size-4" />
                              )}
                              save draft
                            </Button>
                            <Button
                              className="font-mono"
                              disabled={savePostMutation.isPending}
                              onClick={publishPost}
                            >
                              {savePostMutation.isPending ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <Save className="size-4" />
                              )}
                              publish update
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        Create a post or select one from the sidebar to start editing.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {activeSection === "users" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono text-lg">users</CardTitle>
                  <CardDescription>Only admin users should have access to Studio.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={userColumns}
                    data={users}
                    searchColumn="email"
                    searchPlaceholder="Search by email"
                    emptyMessage="No users found."
                  />
                </CardContent>
              </Card>
            ) : null}

            {activeSection === "subscribers" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono text-lg">subscribers</CardTitle>
                  <CardDescription>
                    Current newsletter signups and subscription state.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={subscriberColumns}
                    data={subscribers}
                    searchColumn="email"
                    searchPlaceholder="Search subscribers"
                    emptyMessage="No subscribers found."
                  />
                </CardContent>
              </Card>
            ) : null}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DashboardSection({
  metrics,
}: {
  metrics: {
    publishedPosts: number
    draftPosts: number
    totalLikes: number
    totalComments: number
    adminUsers: number
    activeSubscribers: number
  }
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="published posts" value={metrics.publishedPosts} />
        <MetricCard label="draft posts" value={metrics.draftPosts} />
        <MetricCard label="likes" value={metrics.totalLikes} />
        <MetricCard label="comments" value={metrics.totalComments} />
        <MetricCard label="admin users" value={metrics.adminUsers} />
        <MetricCard label="subscribers" value={metrics.activeSubscribers} />
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function MetricCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="font-mono text-xs uppercase tracking-[0.2em]">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-3xl font-semibold">
          {value}
          {suffix ? <span className="ml-1 text-lg text-muted-foreground">{suffix}</span> : null}
        </p>
      </CardContent>
    </Card>
  )
}

function TableHeaderButton({ label, onClick }: { label: string; onClick?: () => void }) {
  if (!onClick) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  )
}

function createEditorState(post: AdminPost | null): PostEditorState {
  if (!post) {
    return {
      title: "",
      slug: "",
      category: "Blog",
      description: "",
      published: false,
      date: new Date().toISOString().slice(0, 10),
      tags: "",
      headerImageUrl: "",
      content: "",
    }
  }

  return {
    title: post.title,
    slug: post.slug,
    category: post.category,
    description: post.description,
    published: post.published,
    date: new Date(post.date).toISOString().slice(0, 10),
    tags: (post.tags ?? []).join(", "),
    headerImageUrl: post.headerImageUrl ?? "",
    content: post.content ?? "",
  }
}

function absolutizeStudioAssetUrl(value: string, dotdevBaseUrl: string) {
  if (!value.startsWith("/")) {
    return value
  }

  return `${dotdevBaseUrl}${value}`
}

function absolutizeStudioPreviewContent(content: string, dotdevBaseUrl: string) {
  return content
    .replaceAll(/]\((\/[^)\s]+)\)/g, `](${dotdevBaseUrl}$1)`)
    .replaceAll(/src="(\/[^"]+)"/g, `src="${dotdevBaseUrl}$1"`)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function parseTagList(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function normalizeRole(role: string | string[] | null | undefined): "admin" | "user" {
  if (Array.isArray(role)) {
    return role[0] === "admin" ? "admin" : "user"
  }

  return role === "admin" ? "admin" : "user"
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Failed to read file."))
        return
      }

      const [, base64 = ""] = result.split(",")
      resolve(base64)
    }

    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."))
    reader.readAsDataURL(file)
  })
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
