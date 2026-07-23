import { z } from "zod/v4"

export const MAX_POST_CONTENT_BYTES = 1024 * 1024
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024

const MAX_POST_IMAGE_BASE64_LENGTH = Math.ceil(MAX_POST_IMAGE_BYTES / 3) * 4
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

export const SAFE_POST_IMAGE_MIME_TYPES = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

type SafePostImageMimeType = (typeof SAFE_POST_IMAGE_MIME_TYPES)[number]

export const adminPostSlugSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[a-z0-9-]+$/)

export const adminPostFileNameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/)
  .refine((value) => !value.includes(".."), "File name cannot contain '..'.")

export const adminPostContentSchema = z
  .string()
  .refine(
    (content) => Buffer.byteLength(content, "utf8") <= MAX_POST_CONTENT_BYTES,
    `Post content cannot exceed ${MAX_POST_CONTENT_BYTES} bytes.`,
  )

export const adminPostContentInput = z
  .object({
    id: z.string().uuid(),
    slug: adminPostSlugSchema,
    content: adminPostContentSchema,
  })
  .strict()

function startsWithBytes(buffer: Buffer, signature: readonly number[]): boolean {
  return (
    buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte)
  )
}

function matchesImageSignature(buffer: Buffer, fileType: SafePostImageMimeType): boolean {
  switch (fileType) {
    case "image/gif":
      return (
        buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
        buffer.subarray(0, 6).toString("ascii") === "GIF89a"
      )
    case "image/jpeg":
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff])
    case "image/png":
      return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      )
  }
}

export function decodeAndValidatePostImage(
  fileData: string,
  fileType: SafePostImageMimeType,
): Buffer {
  const buffer = Buffer.from(fileData, "base64")

  if (buffer.length === 0) {
    throw new Error("Image cannot be empty.")
  }

  if (buffer.length > MAX_POST_IMAGE_BYTES) {
    throw new Error(`Image cannot exceed ${MAX_POST_IMAGE_BYTES} bytes.`)
  }

  if (!matchesImageSignature(buffer, fileType)) {
    throw new Error(`Image bytes do not match the declared ${fileType} type.`)
  }

  return buffer
}

const rawAdminPostImageInput = z
  .object({
    slug: adminPostSlugSchema,
    fileName: adminPostFileNameSchema,
    fileType: z.enum(SAFE_POST_IMAGE_MIME_TYPES),
    fileData: z
      .string()
      .min(1)
      .max(MAX_POST_IMAGE_BASE64_LENGTH)
      .regex(BASE64_PATTERN, "Image data must be valid base64."),
  })
  .strict()

export const adminPostImageInput = rawAdminPostImageInput.transform((input, context) => {
  try {
    return {
      slug: input.slug,
      fileName: input.fileName,
      fileType: input.fileType,
      file: decodeAndValidatePostImage(input.fileData, input.fileType),
    }
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Invalid image data.",
    })
    return z.NEVER
  }
})
