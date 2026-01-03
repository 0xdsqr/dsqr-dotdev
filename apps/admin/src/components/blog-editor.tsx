"use client"

import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Clock, Eye, FileText, Plus, Save, X } from "lucide-react"
import { useState } from "react"
import { BlogPostViewer } from "@/components/blog-post-viewer"
import { EditorToolbar } from "@/components/editor-toolbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTRPC } from "@/lib/trpc"

interface BlogEditorProps {
  post?: {
    id: string
    title: string
    slug: string
    description: string
    content: string | null
    filePath: string | null
    category: string
    tags: string[] | null
    published: boolean
    headerImageUrl: string | null
    readingTimeMinutes: number | null
  }
}

export function BlogEditor({ post }: BlogEditorProps) {
  const navigate = useNavigate()
  const trpc = useTRPC()

  const [title, setTitle] = useState(post?.title || "")
  const [slug, setSlug] = useState(post?.slug || "")
  const [description, setDescription] = useState(post?.description || "")
  const [content, setContent] = useState(post?.content || "")
  const [category, setCategory] = useState(post?.category || "engineering")
  const [tags, setTags] = useState<string[]>(post?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState("write")
  const [published, _setPublished] = useState(post?.published || false)
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(
    post?.readingTimeMinutes || 5,
  )
  const [headerImageUrl, setHeaderImageUrl] = useState(
    post?.headerImageUrl || "",
  )

  const createMutation = useMutation(trpc.post.create.mutationOptions())
  const updateMutation = useMutation(trpc.post.update.mutationOptions())
  const uploadImageMutation = useMutation(trpc.post.uploadImage.mutationOptions())

  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleImageUpload = async (file: File) => {
    if (!slug) {
      alert("Please set a slug before uploading images")
      return
    }

    setIsUploadingImage(true)
    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      )

      const result = await uploadImageMutation.mutateAsync({
        slug,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
      })

      // Insert markdown image at cursor position
      const textarea = document.getElementById("content-editor") as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const imageMarkdown = `![${file.name}](${result.url})`
        const newContent = content.substring(0, start) + imageMarkdown + content.substring(start)
        setContent(newContent)

        // Move cursor after inserted image
        setTimeout(() => {
          textarea.focus()
          const newPos = start + imageMarkdown.length
          textarea.setSelectionRange(newPos, newPos)
        }, 0)
      }
    } catch (error) {
      console.error("Image upload failed:", error)
      alert("Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!post) {
      // Only auto-generate slug for new posts
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      )
    }
  }

  const handleSave = async (publishState: boolean) => {
    try {
      if (post) {
        // Update existing post metadata
        const updateData = {
          title,
          slug,
          description,
          category,
          tags,
          published: publishState,
          readingTimeMinutes: readingTimeMinutes || 5,
          headerImageUrl: headerImageUrl || undefined,
        }
        console.log("Sending update:", { id: post.id, data: updateData })
        await updateMutation.mutateAsync({
          id: post.id,
          data: updateData,
        })
      } else {
        // Create new post
        await createMutation.mutateAsync({
          title,
          slug,
          description,
          category,
          tags,
          published: publishState,
          readingTimeMinutes: readingTimeMinutes || 5,
          headerImageUrl: headerImageUrl || undefined,
          content,
          date: new Date(),
        })
      }
    } catch (error) {
      console.error("Save failed:", error)
    }
  }

  // Save draft keeps current published state (or false for new posts)
  const handleSaveDraft = () => handleSave(published)
  const handlePublish = () => handleSave(true)
  const handleUnpublish = () => handleSave(false)

  const handleFormat = (format: string) => {
    const textarea = document.getElementById(
      "content-editor",
    ) as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let newText = ""
    let cursorOffset = 0

    switch (format) {
      case "bold":
        newText = `**${selectedText}**`
        cursorOffset = 2
        break
      case "italic":
        newText = `*${selectedText}*`
        cursorOffset = 1
        break
      case "code":
        newText = `\`${selectedText}\``
        cursorOffset = 1
        break
      case "link":
        newText = `[${selectedText}](url)`
        cursorOffset = 1
        break
      case "h1":
        newText = `# ${selectedText}`
        cursorOffset = 2
        break
      case "h2":
        newText = `## ${selectedText}`
        cursorOffset = 3
        break
      case "h3":
        newText = `### ${selectedText}`
        cursorOffset = 4
        break
      case "quote":
        newText = `> ${selectedText}`
        cursorOffset = 2
        break
      case "ul":
        newText = `- ${selectedText}`
        cursorOffset = 2
        break
      case "ol":
        newText = `1. ${selectedText}`
        cursorOffset = 3
        break
      case "codeblock":
        newText = `\`\`\`\n${selectedText}\n\`\`\``
        cursorOffset = 4
        break
      default:
        return
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos =
        start + (selectedText ? newText.length : cursorOffset)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const [isSavingContent] = useState(false)
  const isSaving =
    createMutation.isPending || updateMutation.isPending || isSavingContent

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 bg-background">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate({ to: "/posts" })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <FileText className="h-4 w-4" />
            <span>Blog Posts</span>
            <span className="text-border">/</span>
            <span className="text-foreground">
              {post ? "Edit Post" : "New Post"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-4">
            <Clock className="h-3 w-3" />
            <span>{published ? "Published" : "Draft"}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={published ? handleUnpublish : handlePublish}
            disabled={isSaving}
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={handleSaveDraft} size="sm" disabled={isSaving}>
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title & Metadata */}
          <div className="border-b border-border p-6 space-y-4">
            <Input
              placeholder="Post title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-2xl font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="post-slug"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Slug
                </label>
                <Input
                  id="post-slug"
                  placeholder="post-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono text-sm rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="post-category"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Category
                </label>
                <Input
                  id="post-category"
                  placeholder="engineering"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-sm rounded-lg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="post-description"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Description
              </label>
              <Input
                id="post-description"
                placeholder="Brief description of your post..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="post-header-image"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Header Image URL
                </label>
                <Input
                  id="post-header-image"
                  placeholder="https://cdn.dsqr.dev/..."
                  value={headerImageUrl}
                  onChange={(e) => setHeaderImageUrl(e.target.value)}
                  className="text-sm rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="post-reading-time"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Reading Time (minutes)
                </label>
                <Input
                  id="post-reading-time"
                  type="number"
                  min={1}
                  placeholder="5"
                  value={readingTimeMinutes || ""}
                  onChange={(e) =>
                    setReadingTimeMinutes(
                      e.target.value ? Number(e.target.value) : 0,
                    )
                  }
                  className="text-sm rounded-lg"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="post-tags"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 w-24 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  />
                  {tagInput && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleAddTag}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editor Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-2">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="write"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-3 py-1.5 text-sm"
                >
                  Write
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-3 py-1.5 text-sm"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {activeTab === "write" && (
                <EditorToolbar
                  onFormat={handleFormat}
                  onImageUpload={handleImageUpload}
                  isUploadingImage={isUploadingImage}
                />
              )}
            </div>

            <TabsContent
              value="write"
              className="flex-1 overflow-hidden mt-0 p-0"
            >
              <textarea
                id="content-editor"
                placeholder="Start writing your post... Use markdown for formatting."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full resize-none bg-transparent px-6 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-mono text-sm leading-relaxed"
              />
            </TabsContent>

            <TabsContent
              value="preview"
              className="flex-1 overflow-auto mt-0 p-6"
            >
              {content ? (
                <BlogPostViewer content={content} />
              ) : (
                <div className="text-muted-foreground/50 italic">
                  Nothing to preview yet. Start writing!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
