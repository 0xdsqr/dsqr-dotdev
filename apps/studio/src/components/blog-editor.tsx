import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@dsqr-dotdev/ui/components/alert-dialog"
import { Button } from "@dsqr-dotdev/ui/components/button"
import { Input } from "@dsqr-dotdev/ui/components/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dsqr-dotdev/ui/components/tabs"
import { Textarea } from "@dsqr-dotdev/ui/components/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Eye, EyeOff, FileEdit, Save, Send, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import { BlogPostViewer } from "@/components/blog-post-viewer"
import { useTRPC } from "@/lib/trpc"

interface Post {
  id: string
  title: string
  slug: string
  content: string | null
  description: string
  headerImageUrl: string | null
  category: string
  tags: string[] | null
  published: boolean
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
  const [description, setDescription] = useState(post?.description || "")
  const [category, setCategory] = useState(post?.category || "")
  const [tags, setTags] = useState(post?.tags?.join(", ") || "")
  const [headerImageUrl, setHeaderImageUrl] = useState(post?.headerImageUrl || "")

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

  const deleteMutation = useMutation(
    trpc.post.delete.mutationOptions({
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

  const parseTags = (input: string): string[] =>
    input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

  const handleSave = (publish: boolean) => {
    const postData = {
      title,
      slug,
      content: content || undefined,
      description: description || title,
      category: category || "Blog",
      tags: tags ? parseTags(tags) : undefined,
      headerImageUrl: headerImageUrl || undefined,
      published: publish,
      date: new Date(),
    }

    if (post) {
      updateMutation.mutate({
        id: post.id,
        data: postData,
      })
    } else {
      createMutation.mutate({
        ...postData,
        description: postData.description,
        category: postData.category,
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

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
            <Button variant="outline" size="sm" onClick={generateSlug} type="button">
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
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="headerImageUrl">
            Cover Image URL
          </label>
          <Input
            id="headerImageUrl"
            value={headerImageUrl}
            onChange={(e) => setHeaderImageUrl(e.target.value)}
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
            {post && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="destructive" size="sm" disabled={isDeleting} />}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{title || post.title}
                      &quot;. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: post.id })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {post?.published && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving || !title || !slug}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
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
