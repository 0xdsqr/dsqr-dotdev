import { Effect } from "effect"
import { runApiEffect } from "../../runtime"
import { StorageError, StorageService } from "../../services/storage"

export const BUCKET_NAME = process.env.S3_BUCKET || "dsqr-dotdev"

function unwrapStorageError(error: unknown, message: string): never {
  if (error instanceof StorageError) {
    throw new Error(message, { cause: error.cause })
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

export async function getPostImage(
  slug: string,
  fileName: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  return await runApiEffect(
    Effect.gen(function* () {
      const storage = yield* StorageService
      return yield* storage.getPostImage(slug, fileName)
    }),
  )
}
