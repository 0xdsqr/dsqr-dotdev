import { database } from "@dsqr-dotdev/database/client"
import { posts } from "@dsqr-dotdev/database/schema"
import { and, eq } from "drizzle-orm"
import { Data, Effect } from "effect"
import { z } from "zod/v4"
import { runApiEffect } from "../../runtime"
import { StorageError, StorageService } from "../../services/storage"

export const BUCKET_NAME = process.env.S3_BUCKET || "dsqr-dotdev"

export const publicPostImageInput = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(256)
      .regex(/^[a-z0-9-]+$/),
    fileName: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .refine((value) => !value.includes("..")),
  })
  .strict()

export function publishedPostSlugWhere(slug: string) {
  return and(eq(posts.slug, slug), eq(posts.published, true))
}

class StorageBoundaryError extends Data.TaggedError("StorageBoundaryError")<{
  readonly message: string
  readonly cause: unknown
}> {}

class PublishedPostImageLookupError extends Data.TaggedError("PublishedPostImageLookupError")<{
  readonly cause: unknown
}> {}

function unwrapStorageError(error: unknown, message: string): never {
  if (error instanceof StorageError) {
    throw new StorageBoundaryError({ message, cause: error.cause })
  }

  throw error
}

export async function uploadPostContent(slug: string, content: string): Promise<string> {
  try {
    return await runApiEffect(
      Effect.gen(function* () {
        const storage = yield* StorageService
        return yield* storage.uploadPostContent(slug, content)
      }),
    )
  } catch (error) {
    unwrapStorageError(error, "Failed to upload post content to storage")
  }
}

export async function getPostContent(filePath: string): Promise<string | null> {
  return await runApiEffect(
    Effect.gen(function* () {
      const storage = yield* StorageService
      return yield* storage.getPostContent(filePath)
    }),
  )
}

export async function uploadPostImage(
  slug: string,
  file: Buffer,
  fileName: string,
  fileType: string,
): Promise<string> {
  try {
    return await runApiEffect(
      Effect.gen(function* () {
        const storage = yield* StorageService
        return yield* storage.uploadPostImage(slug, file, fileName, fileType)
      }),
    )
  } catch (error) {
    unwrapStorageError(error, "Failed to upload image to storage")
  }
}

export async function getPublishedPostImage(
  slug: string,
  fileName: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const input = publicPostImageInput.safeParse({ slug, fileName })
  if (!input.success) {
    return null
  }

  return await runApiEffect(
    Effect.gen(function* () {
      const [publishedPost] = yield* Effect.tryPromise({
        try: async () =>
          await database
            .select({ slug: posts.slug })
            .from(posts)
            .where(publishedPostSlugWhere(input.data.slug))
            .limit(1),
        catch: (cause) => new PublishedPostImageLookupError({ cause }),
      })

      if (!publishedPost) {
        return null
      }

      const storage = yield* StorageService
      return yield* storage.getPostImage(publishedPost.slug, input.data.fileName)
    }),
  )
}
