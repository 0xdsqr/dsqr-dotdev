import type { getAdminBootstrap } from "./admin-data"

export type AdminBootstrap = Awaited<ReturnType<typeof getAdminBootstrap>>
export type AdminPost = AdminBootstrap["posts"][number]
export type AdminUser = AdminBootstrap["users"][number]
export type AdminSubscriber = AdminBootstrap["subscribers"][number]

export const supportedPostImageTypes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const
export const maxPostImageBytes = 5 * 1024 * 1024
type SupportedPostImageType = (typeof supportedPostImageTypes)[number]

export function isSupportedPostImageType(fileType: string): fileType is SupportedPostImageType {
  return supportedPostImageTypes.some((supportedType) => supportedType === fileType)
}

export type PostEditorState = {
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

export function createEditorState(post: AdminPost | null): PostEditorState {
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

export function absolutizeStudioAssetUrl(value: string, dotdevBaseUrl: string) {
  if (!value.startsWith("/")) {
    return value
  }

  return `${dotdevBaseUrl}${value}`
}

export function absolutizeStudioPreviewContent(content: string, dotdevBaseUrl: string) {
  return content
    .replaceAll(/]\((\/[^)\s]+)\)/g, `](${dotdevBaseUrl}$1)`)
    .replaceAll(/src="(\/[^"]+)"/g, `src="${dotdevBaseUrl}$1"`)
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function parseTagList(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

export function normalizeRole(role: string | string[] | null | undefined): "admin" | "user" {
  if (Array.isArray(role)) {
    return role[0] === "admin" ? "admin" : "user"
  }

  return role === "admin" ? "admin" : "user"
}

export function readFileAsBase64(file: File) {
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

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
