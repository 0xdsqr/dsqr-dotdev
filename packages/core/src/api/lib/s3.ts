import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { logger } from "./logger"

const log = logger

const BUCKET_NAME = process.env.S3_BUCKET || "dsqr-dotdev"
const POSTS_PREFIX = "posts"
const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_USE_SSL = process.env.S3_USE_SSL === "true"
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE !== "false"

function getS3Endpoint() {
  if (!S3_ENDPOINT) {
    return undefined
  }

  if (S3_ENDPOINT.startsWith("http://") || S3_ENDPOINT.startsWith("https://")) {
    return S3_ENDPOINT
  }

  return `${S3_USE_SSL ? "https" : "http"}://${S3_ENDPOINT}`
}

function createS3Client() {
  return new S3Client({
    endpoint: getS3Endpoint(),
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    forcePathStyle: S3_FORCE_PATH_STYLE,
    requestHandler: {
      requestTimeout: 5_000, // 5s timeout — fail fast if S3 is unreachable
      connectionTimeout: 3_000,
    },
  })
}

const s3Client = createS3Client()

async function ensureBucketAccessible(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
  } catch (error: unknown) {
    const errorCode = error instanceof Error && "name" in error ? error.name : "Unknown"

    log.error("S3 bucket not accessible", {
      bucket: BUCKET_NAME,
      errorCode,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    throw new Error(
      `S3 bucket '${BUCKET_NAME}' is not accessible. Provision it in RustFS before uploading content.`,
    )
  }
}

export async function uploadAvatar(
  userId: string,
  file: Buffer,
  fileName: string,
  fileType: string,
): Promise<string> {
  const key = `avatars/${userId}/${fileName}`

  await ensureBucketAccessible()

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: fileType,
      }),
    )

    // Return relative path (best practice: avoids hardcoded domains, works across environments)
    const avatarPath = `/api/avatar/${userId}/${fileName}`

    log.debug("Avatar uploaded", { userId, key })
    return avatarPath
  } catch (error) {
    log.error("Failed to upload avatar", {
      userId,
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw new Error("Failed to upload image to storage")
  }
}

export async function getAvatar(
  userId: string,
  fileName: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const key = `avatars/${userId}/${fileName}`

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
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
  } catch {
    return null
  }
}

/**
 * Upload post MDX content to S3
 * @param slug - Post slug used for the file path
 * @param content - MDX content string
 * @returns The object key for storing in the database
 */
export async function uploadPostContent(slug: string, content: string): Promise<string> {
  const key = `${POSTS_PREFIX}/${slug}/index.mdx`

  await ensureBucketAccessible()

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: "text/mdx",
      }),
    )

    log.debug("Post content uploaded", { slug, key })
    return key
  } catch (error) {
    log.error("Failed to upload post content", {
      slug,
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw new Error("Failed to upload post content to storage")
  }
}

/**
 * Get post content from S3
 * @param filePath - The object key stored in the database
 * @returns The MDX content string or null if not found
 */
export async function getPostContent(filePath: string): Promise<string | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
      }),
    )

    if (!response.Body) {
      return null
    }

    return await response.Body.transformToString()
  } catch (error) {
    log.error("Failed to fetch post content from storage", {
      bucket: BUCKET_NAME,
      key: filePath,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return null
  }
}

/**
 * Upload an image for a blog post to S3
 * @param slug - Post slug used for the file path
 * @param file - Image buffer
 * @param fileName - Original file name
 * @param fileType - MIME type of the image
 * @returns The relative URL path for the image
 */
export async function uploadPostImage(
  slug: string,
  file: Buffer,
  fileName: string,
  fileType: string,
): Promise<string> {
  // Sanitize filename and add timestamp to avoid conflicts
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-")
  const key = `${POSTS_PREFIX}/${slug}/images/${timestamp}-${sanitizedName}`

  await ensureBucketAccessible()

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: fileType,
      }),
    )

    // Return relative path that will be served via API route
    const imagePath = `/api/posts/${slug}/images/${timestamp}-${sanitizedName}`

    log.debug("Post image uploaded", { slug, key })
    return imagePath
  } catch (error) {
    log.error("Failed to upload post image", {
      slug,
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw new Error("Failed to upload image to storage")
  }
}

/**
 * Get a post image from S3
 * @param slug - Post slug
 * @param fileName - Image file name
 * @returns The image stream and content type, or null if not found
 */
export async function getPostImage(
  slug: string,
  fileName: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const key = `${POSTS_PREFIX}/${slug}/images/${fileName}`

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
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
  } catch {
    return null
  }
}

export { s3Client, BUCKET_NAME }
