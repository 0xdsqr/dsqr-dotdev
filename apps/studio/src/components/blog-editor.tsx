import { Button } from "@dsqr-dotdev/ui/components/button"
import { Input } from "@dsqr-dotdev/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@dsqr-dotdev/ui/components/tabs"
import { Textarea } from "@dsqr-dotdev/ui/components/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Eye, FileEdit, Save, Send } from "lucide-react"
import { useCallback, useState } from "react"
import { BlogPostViewer } from "@/components/blog-post-viewer"
import { useTRPC } from "@/lib/trpc"

interface Post {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  coverImage: string | null
  category: string | null
  tags: string | null
  status: string
}

interface BlogEditorProps {
  post?: Post
}

export function BlogEditor({ post }: BlogEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const [title, setTitle] = useState(post?.title || "")
  const [slug, setSlug] = useState(post?.slug || "")
  const [content, setContent] = useState(post?.content || "")
  const [excerpt, setExcerpt] = useState(post?.excerpt || "")
  const [category, setCategory] = useState(post?.category || "")
  const [tags, setTags] = useState(post?.tags || "")
  const [coverImage, setCoverImage] = useState(post?.coverImage || "")

  const createMutation = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["post"]] })
        navigate({ to: "/blog" })
      },
    }),
  )

  const updateMutation = useMutation(
    trpc.post.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["post"]] })
        navigate({ to: "/blog" })
      },
    }),
  )

  const generateSlug = useCallback(() => {
    const generated = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setSlug(generated)
  }, [title])

  const handleSave = (status: string) => {
    if (post) {
      updateMutation.mutate({
        id: post.id,
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        category: category || undefined,
        tags: tags || undefined,
        coverImage: coverImage || undefined,
        status,
      })
    } else {
      createMutation.mutate({
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        category: category || undefined,
        tags: tags || undefined,
        coverImage: coverImage || undefined,
        status,
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      {/* Metadata */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="slug">
            Slug
          </label>
          <div className="flex gap-2">
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-slug"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={generateSlug}
              type="button"
            >
              Generate
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="category">
            Category
          </label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. engineering, devops"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="tags">
            Tags
          </label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma-separated tags"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="excerpt">
            Excerpt
          </label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief description"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="coverImage">
            Cover Image URL
          </label>
          <Input
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Editor / Preview */}
      <Tabs defaultValue="edit" className="flex-1">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="edit">
              <FileEdit className="mr-2 h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("draft")}
              disabled={isSaving || !title || !slug}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave("published")}
              disabled={isSaving || !title || !slug || !content}
            >
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post in markdown..."
            className="min-h-[500px] font-mono text-sm resize-y"
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <div className="rounded-lg border bg-card p-6 min-h-[500px]">
            {content ? (
              <BlogPostViewer content={content} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Nothing to preview yet. Start writing in the editor tab.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
