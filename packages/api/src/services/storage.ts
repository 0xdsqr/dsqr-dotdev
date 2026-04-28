import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Context, Data, Effect, Layer } from "effect"
import { logger } from "../api/lib/logger"

const POSTS_PREFIX = "posts"

export class StorageError extends Data.TaggedError("StorageError")<{
  operation: string
  cause: unknown
}> {}

export type PostImage = {
  body: ReadableStream
  contentType: string
}

export type StorageServiceShape = {
  readonly bucketName: string
  readonly s3Client: S3Client
  readonly uploadPostContent: (slug: string, content: string) => Effect.Effect<string, StorageError>
  readonly getPostContent: (filePath: string) => Effect.Effect<string | null, never>
  readonly uploadPostImage: (
    slug: string,
    file: Buffer,
    fileName: string,
    fileType: string,
  ) => Effect.Effect<string, StorageError>
  readonly getPostImage: (slug: string, fileName: string) => Effect.Effect<PostImage | null, never>
}

function getS3Endpoint() {
  const endpoint = process.env.S3_ENDPOINT
  if (!endpoint) {
    return undefined
  }

  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint
  }

  return `${process.env.S3_USE_SSL === "true" ? "https" : "http"}://${endpoint}`
}

function createS3Client() {
  return new S3Client({
    endpoint: getS3Endpoint(),
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    requestHandler: {
      requestTimeout: 5_000,
      connectionTimeout: 3_000,
    },
  })
}

function makeService(): StorageServiceShape {
  const bucketName = process.env.S3_BUCKET || "dsqr-dotdev"
  const s3Client = createS3Client()

  const ensureBucketAccessible = Effect.tryPromise({
    try: () => s3Client.send(new HeadBucketCommand({ Bucket: bucketName })),
    catch: (cause) => new StorageError({ operation: "s3.headBucket", cause }),
  }).pipe(
    Effect.tapError((error) =>
      Effect.sync(() => {
        const cause = error.cause
        logger.error("S3 bucket not accessible", {
          bucket: bucketName,
          errorCode: cause instanceof Error ? cause.name : "Unknown",
          error: cause instanceof Error ? cause.message : "Unknown error",
        })
      }),
    ),
    Effect.asVoid,
    Effect.withSpan("storage.s3.ensureBucketAccessible"),
  )

  return {
    bucketName,
    s3Client,
    uploadPostContent: (slug, content) => {
      const key = `${POSTS_PREFIX}/${slug}/index.mdx`

      return Effect.gen(function* () {
        yield* ensureBucketAccessible
        yield* Effect.tryPromise({
          try: () =>
            s3Client.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: content,
                ContentType: "text/mdx",
              }),
            ),
          catch: (cause) => new StorageError({ operation: "s3.putPostContent", cause }),
        })

        logger.debug("Post content uploaded", { slug, key })
        return key
      }).pipe(Effect.withSpan("storage.postContent.upload", { attributes: { slug } }))
    },
    getPostContent: (filePath) =>
      Effect.tryPromise({
        try: async () => {
          const response = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: filePath,
            }),
          )

          if (!response.Body) {
            return null
          }

          return await response.Body.transformToString()
        },
        catch: (cause) => new StorageError({ operation: "s3.getPostContent", cause }),
      }).pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            const cause = error.cause
            logger.error("Failed to fetch post content from storage", {
              bucket: bucketName,
              key: filePath,
              error: cause instanceof Error ? cause.message : "Unknown error",
            })
          }),
        ),
        Effect.catchAll(() => Effect.succeed(null)),
        Effect.withSpan("storage.postContent.get"),
      ),
    uploadPostImage: (slug, file, fileName, fileType) => {
      const timestamp = Date.now()
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-")
      const key = `${POSTS_PREFIX}/${slug}/images/${timestamp}-${sanitizedName}`

      return Effect.gen(function* () {
        yield* ensureBucketAccessible
        yield* Effect.tryPromise({
          try: () =>
            s3Client.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: file,
                ContentType: fileType,
              }),
            ),
          catch: (cause) => new StorageError({ operation: "s3.putPostImage", cause }),
        })

        logger.debug("Post image uploaded", { slug, key })
        return `/api/posts/${slug}/images/${timestamp}-${sanitizedName}`
      }).pipe(Effect.withSpan("storage.postImage.upload", { attributes: { slug, fileType } }))
    },
    getPostImage: (slug, fileName) => {
      const key = `${POSTS_PREFIX}/${slug}/images/${fileName}`

      return Effect.tryPromise({
        try: async () => {
          const response = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
            }),
          )

          if (!response.Body) {
            return null
          }

          return {
            body: response.Body.transformToWebStream(),
            contentType: response.ContentType || "image/jpeg",
          }
        },
        catch: (cause) => new StorageError({ operation: "s3.getPostImage", cause }),
      }).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
        Effect.withSpan("storage.postImage.get", { attributes: { slug } }),
      )
    },
  }
}

export class StorageService extends Context.Tag("@dsqr-dotdev/api/StorageService")<
  StorageService,
  StorageServiceShape
>() {
  static Live = Layer.sync(this, makeService).pipe(
    Layer.annotateSpans({ module: "StorageService" }),
  )
}
