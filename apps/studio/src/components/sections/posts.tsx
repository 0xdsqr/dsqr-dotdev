import { Badge } from "@dsqr-dotdev/react/components/ui/badge"
import { BlogPostViewer } from "@dsqr-dotdev/react/components/blog-post-viewer"
import { Button } from "@dsqr-dotdev/react/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsqr-dotdev/react/components/ui/card"
import { Input } from "@dsqr-dotdev/react/components/ui/input"
import { Separator } from "@dsqr-dotdev/react/components/ui/separator"
import { Switch } from "@dsqr-dotdev/react/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dsqr-dotdev/react/components/ui/tabs"
import { Textarea } from "@dsqr-dotdev/react/components/ui/textarea"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import {
  ExternalLink,
  Eye,
  LoaderCircle,
  PenLine,
  Plus,
  Search,
  Save,
  Trash2,
  Upload,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { trpcClient } from "../../lib/trpc"
import type { AdminPost, PostEditorState } from "../../lib/studio"
import {
  absolutizeStudioAssetUrl,
  absolutizeStudioPreviewContent,
  createEditorState,
  estimateReadingTime,
  getErrorMessage,
  isSupportedPostImageType,
  maxPostImageBytes,
  parseTagList,
  readFileAsBase64,
  slugify,
} from "../../lib/studio"
import { Field, MetricCard } from "../studio-ui"

export function PostsSection({
  posts,
  dotdevBaseUrl,
}: {
  posts: AdminPost[]
  dotdevBaseUrl: string
}) {
  const router = useRouter()
  const [postQuery, setPostQuery] = useState("")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(posts[0]?.id ?? null)
  const [editorState, setEditorState] = useState<PostEditorState>(() =>
    createEditorState(posts[0] ?? null),
  )
  const [editorView, setEditorView] = useState<"write" | "preview">("write")
  const [dirty, setDirty] = useState(false)
  const loadedPostIdRef = useRef<string | null>(null)

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

  const updateEditor = (patch: Partial<PostEditorState>) => {
    setEditorState((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  useEffect(() => {
    if (selectedPostId === loadedPostIdRef.current) {
      return
    }

    if (!selectedPost) {
      if (!selectedPostId) {
        loadedPostIdRef.current = null
        setEditorState(createEditorState(null))
        setDirty(false)
      }

      return
    }

    loadedPostIdRef.current = selectedPost.id
    setEditorState(createEditorState(selectedPost))
    setEditorView("write")
    setDirty(false)

    let cancelled = false

    void trpcClient.post.content
      .query({
        postId: selectedPost.id,
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
  }, [selectedPost, selectedPostId])

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
    onSuccess: async (post) => {
      toast.success("New draft created.")
      await router.invalidate()
      setSelectedPostId(post.id)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create draft."))
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

      await trpcClient.post.saveContent.mutate({
        id: post.id,
        slug: normalizedSlug,
        content: editorState.content,
      })

      return { normalizedSlug, published }
    },
    onSuccess: async (result) => {
      setEditorState((current) => ({
        ...current,
        published: result.published,
        slug: result.normalizedSlug,
      }))
      setDirty(false)
      toast.success(result.published ? "Post published." : "Draft saved.")
      await router.invalidate()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to save post."))
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => trpcClient.post.delete.mutate({ id: postId }),
    onSuccess: async (_, postId) => {
      toast.success("Post deleted.")
      loadedPostIdRef.current = null
      setSelectedPostId(posts.find((post) => post.id !== postId)?.id ?? null)
      await router.invalidate()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete post."))
    },
  })

  const uploadHeroMutation = useMutation({
    mutationFn: async ({ post, file }: { post: AdminPost; file: File }) => {
      if (!isSupportedPostImageType(file.type)) {
        throw new Error("Choose a GIF, JPEG, PNG, or WebP image.")
      }

      if (file.size > maxPostImageBytes) {
        throw new Error("Choose an image no larger than 5 MiB.")
      }

      const fileData = await readFileAsBase64(file)
      return trpcClient.post.uploadImage.mutate({
        slug: slugify(editorState.slug || post.slug || post.title),
        fileName: file.name,
        fileType: file.type,
        fileData,
      })
    },
    onSuccess: (result) => {
      updateEditor({ headerImageUrl: result.url })
      toast.success("Hero image uploaded. Save the post to keep it.")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to upload hero image."))
    },
  })

  const previewContent = useMemo(
    () => absolutizeStudioPreviewContent(editorState.content, dotdevBaseUrl),
    [dotdevBaseUrl, editorState.content],
  )
  const previewHeroUrl = editorState.headerImageUrl
    ? absolutizeStudioAssetUrl(editorState.headerImageUrl, dotdevBaseUrl)
    : ""

  const savePost = (published: boolean) => {
    if (!selectedPost) {
      return
    }

    savePostMutation.mutate({ post: selectedPost, published })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="font-mono text-lg">post library</CardTitle>
              <CardDescription>Drafts, published notes, and quick access.</CardDescription>
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
            <div className="flex items-center gap-3">
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
              {selectedPost ? (
                <Tabs
                  value={editorView}
                  onValueChange={(value) => setEditorView(value as "write" | "preview")}
                  className="gap-0"
                >
                  <TabsList>
                    <TabsTrigger
                      value="write"
                      className="gap-2 font-mono text-xs uppercase tracking-[0.25em]"
                    >
                      <PenLine className="size-4" />
                      write
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="gap-2 font-mono text-xs uppercase tracking-[0.25em]"
                    >
                      <Eye className="size-4" />
                      preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPost ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <Input
                    value={editorState.title}
                    onChange={(event) => updateEditor({ title: event.target.value })}
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    value={editorState.slug}
                    onChange={(event) => updateEditor({ slug: event.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <Input
                    value={editorState.category}
                    onChange={(event) => updateEditor({ category: event.target.value })}
                  />
                </Field>
                <Field label="Publish date">
                  <Input
                    type="date"
                    value={editorState.date}
                    onChange={(event) => updateEditor({ date: event.target.value })}
                  />
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  rows={3}
                  value={editorState.description}
                  onChange={(event) => updateEditor({ description: event.target.value })}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <Field label="Tags">
                  <Input
                    value={editorState.tags}
                    onChange={(event) => updateEditor({ tags: event.target.value })}
                    placeholder="aws, distributed-systems, reliability"
                  />
                </Field>
                <Field label="Visibility">
                  <div className="flex h-10 items-center justify-between rounded-md border border-input px-3">
                    <span className="text-sm text-muted-foreground">
                      {editorState.published ? "published to dsqr.dev" : "kept private as draft"}
                    </span>
                    <Switch
                      checked={editorState.published}
                      onCheckedChange={(checked) => updateEditor({ published: checked })}
                    />
                  </div>
                </Field>
              </div>

              <Field label="Hero image URL">
                <div className="space-y-3">
                  <Input
                    value={editorState.headerImageUrl}
                    onChange={(event) => updateEditor({ headerImageUrl: event.target.value })}
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
                      <span className="text-xs font-mono text-muted-foreground">uploading...</span>
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
                <Tabs value={editorView} className="gap-4">
                  <TabsContent value="write" className="mt-0">
                    <Textarea
                      rows={24}
                      value={editorState.content}
                      onChange={(event) => updateEditor({ content: event.target.value })}
                      className="min-h-[34rem] font-mono text-sm leading-7"
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="mt-0">
                    <div className="min-h-[34rem] rounded-xl border border-border bg-card/40 p-5 md:p-6">
                      <BlogPostViewer content={previewContent} />
                    </div>
                  </TabsContent>
                </Tabs>
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
                  {dirty ? "Unsaved changes." : "No unsaved changes."}
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
                    onClick={() => savePost(false)}
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
                    onClick={() => savePost(true)}
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
  )
}
