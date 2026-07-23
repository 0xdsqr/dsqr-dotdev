import { publicAppRouter } from "@dsqr-dotdev/api"
import { posts } from "@dsqr-dotdev/database/schema"
import { drizzle } from "drizzle-orm/node-postgres"
import { getIp } from "better-auth/api"
import { describe, expect, it } from "vitest"
import { adminAppRouter } from "../../../packages/api/src/api/admin"
import {
  adminPostContentInput,
  adminPostFileNameSchema,
  adminPostImageInput,
  decodeAndValidatePostImage,
  MAX_POST_CONTENT_BYTES,
  MAX_POST_IMAGE_BYTES,
} from "../../../packages/api/src/api/lib/post-admin-input"
import { publicPostImageInput, publishedPostSlugWhere } from "../../../packages/api/src/api/lib/s3"
import {
  buildPublicCommentTree,
  publicPostContentInput,
  publishedPostWhere,
} from "../../../packages/api/src/api/router/post"
import { authorizeAuthoritativeUser } from "../../../packages/api/src/api/trpc"
import {
  adminSubscriberSelection,
  handleSubscriptionError,
  isUniqueConstraintViolation,
  subscriptionAccepted,
} from "../../../packages/api/src/api/router/email"
import {
  AUTH_COOKIE_PREFIXES,
  createAuthOptions,
  createAuthSurfacePlugins,
  initAuth,
} from "../../../packages/api/src/auth"
import { hasActiveBan } from "../../../packages/api/src/auth/user-status"
import {
  getPublicBaseUrl as getDotdevPublicBaseUrl,
  getTrustedOrigins as getDotdevTrustedOrigins,
} from "./lib/runtime-url"
import {
  getPublicBaseUrl as getStudioPublicBaseUrl,
  getTrustedOrigins as getStudioTrustedOrigins,
} from "../../studio/src/lib/runtime-url"
import {
  requireAuthoritativeStudioAdmin,
  resolveAuthoritativeStudioAdmin,
} from "../../studio/src/lib/admin-authorization"

describe("tRPC surface isolation", () => {
  it("never mounts an admin procedure in the public application router", () => {
    expect(Object.keys(publicAppRouter._def.procedures).sort()).toEqual(
      [
        "email.subscribe",
        "misc.gpgData",
        "post.all",
        "post.byId",
        "post.bySlug",
        "post.commentCount",
        "post.content",
        "post.createComment",
        "post.deleteComment",
        "post.getComments",
        "post.like",
      ].sort(),
    )
  })

  it("mounts the administrative procedures only in the studio router", () => {
    const adminProcedures = Object.keys(adminAppRouter._def.procedures)

    expect(adminProcedures).toEqual(
      expect.arrayContaining([
        "post.create",
        "post.update",
        "post.delete",
        "post.adminAll",
        "post.content",
        "post.saveContent",
        "post.uploadImage",
        "auth.adminUsers",
        "auth.updateUserRole",
        "email.adminSubscribers",
      ]),
    )
    expect(adminProcedures).not.toContain("email.subscribe")
  })

  it("does not install Better Auth administrative plugins on the public surface", () => {
    expect(createAuthSurfacePlugins("public").map((plugin) => plugin.id)).toEqual([])
    expect(createAuthSurfacePlugins("admin").map((plugin) => plugin.id)).toEqual(["admin"])
  })

  it("uses host-only, surface-specific cookies and hashed OTP storage", () => {
    const publicOptions = createAuthOptions({
      baseUrl: "https://dsqr.dev",
      secret: "a".repeat(32),
      surface: "public",
    })
    const adminOptions = createAuthOptions({
      baseUrl: "https://studio.dsqr.dev",
      secret: "b".repeat(32),
      surface: "admin",
    })

    expect(publicOptions.advanced?.cookiePrefix).toBe(AUTH_COOKIE_PREFIXES.public)
    expect(adminOptions.advanced?.cookiePrefix).toBe(AUTH_COOKIE_PREFIXES.admin)
    expect(publicOptions.advanced?.crossSubDomainCookies).toBeUndefined()
    expect(adminOptions.advanced?.crossSubDomainCookies).toBeUndefined()
    expect(publicOptions.emailAndPassword).toBeUndefined()
    expect(publicOptions.plugins?.map((plugin) => plugin.id)).not.toContain("jwt")
    expect(adminOptions.plugins?.map((plugin) => plugin.id)).not.toContain("organization")
    expect(publicOptions.plugins?.find((plugin) => plugin.id === "email-otp")?.options).toEqual(
      expect.objectContaining({ storeOTP: "hashed" }),
    )
    expect(publicOptions.databaseHooks?.session?.create?.before).toBeTypeOf("function")
  })

  it("resolves rate-limit clients through only the declared Traefik proxy range", () => {
    const options = createAuthOptions({
      baseUrl: "https://dsqr.dev",
      secret: "a".repeat(32),
      surface: "public",
      trustedProxies: ["10.0.0.0/16"],
    })

    expect(options.advanced?.ipAddress).toEqual({
      trustedProxies: ["10.0.0.0/16"],
    })
    expect(getIp(new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.1.20" }), options)).toBe(
      "203.0.113.10",
    )
    expect(getIp(new Headers({ "x-forwarded-for": "203.0.113.11, 10.0.1.20" }), options)).toBe(
      "203.0.113.11",
    )
  })

  it("rejects the Better Auth password-signup endpoint", async () => {
    const auth = initAuth({
      baseUrl: "https://dsqr.dev",
      secret: "a".repeat(32),
      surface: "public",
      trustedOrigins: ["https://dsqr.dev"],
    })
    const response = await auth.handler(
      new Request("https://dsqr.dev/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://dsqr.dev",
        },
        body: JSON.stringify({
          name: "Attacker",
          email: "attacker@example.invalid",
          password: "not-a-real-password",
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      code: "EMAIL_PASSWORD_SIGN_UP_DISABLED",
    })
  })
})

describe("authoritative account authorization", () => {
  const verifiedUser = {
    id: "user-id",
    email: "reader@example.invalid",
    emailVerified: true,
    role: "user",
    banned: false,
    banExpires: null,
  }

  it("rejects users that no longer exist, are unverified, or are actively banned", () => {
    expect(() => authorizeAuthoritativeUser(null, "user")).toThrowError(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    )
    expect(() =>
      authorizeAuthoritativeUser({ ...verifiedUser, emailVerified: false }, "user"),
    ).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
    expect(() =>
      authorizeAuthoritativeUser({ ...verifiedUser, banned: true }, "user"),
    ).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("requires the current database role for administrative access", () => {
    expect(() => authorizeAuthoritativeUser(verifiedUser, "admin")).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    )
    expect(authorizeAuthoritativeUser({ ...verifiedUser, role: "admin" }, "admin")).toMatchObject({
      id: "user-id",
      role: "admin",
    })
  })

  it("honors Better Auth's expiring-ban semantics", () => {
    expect(
      hasActiveBan({
        banned: true,
        banExpires: new Date(Date.now() - 1_000),
      }),
    ).toBe(false)
    expect(
      hasActiveBan({
        banned: true,
        banExpires: new Date(Date.now() + 60_000),
      }),
    ).toBe(true)
  })
})

describe("Studio SSR and bootstrap authorization", () => {
  const cachedAdminSession = {
    id: "admin-id",
    email: "admin@example.invalid",
    role: "admin",
  }
  const currentAdmin = {
    id: "admin-id",
    emailVerified: true,
    role: "admin",
    banned: false,
    banExpires: null,
    name: "Current Admin",
  }

  it.each([
    ["demoted", { ...currentAdmin, role: "user" }],
    ["banned", { ...currentAdmin, banned: true }],
    ["unverified", { ...currentAdmin, emailVerified: false }],
    ["deleted", null],
  ])("denies a %s database user even when the cached session claims admin", async (_, dbUser) => {
    const resolvedUser = await resolveAuthoritativeStudioAdmin(
      cachedAdminSession,
      async () => dbUser,
    )

    expect(resolvedUser).toBeNull()
    expect(() => requireAuthoritativeStudioAdmin(resolvedUser)).toThrowError("UNAUTHORIZED")
  })

  it("requires a session user id and never falls back to cached role or email", async () => {
    let lookupCalled = false

    await expect(
      resolveAuthoritativeStudioAdmin(
        {
          email: "admin@example.invalid",
          role: "admin",
        },
        async () => {
          lookupCalled = true
          return currentAdmin
        },
      ),
    ).resolves.toBeNull()
    expect(lookupCalled).toBe(false)
  })

  it("returns the current authoritative admin row rather than cached session claims", async () => {
    await expect(
      resolveAuthoritativeStudioAdmin(cachedAdminSession, async (userId) => {
        expect(userId).toBe("admin-id")
        return currentAdmin
      }),
    ).resolves.toEqual(currentAdmin)
  })
})

describe("published post boundary", () => {
  it("does not accept caller-controlled storage keys", () => {
    const postId = "1519ff60-fb32-43f0-ae85-d352311421cc"

    expect(publicPostContentInput.parse({ postId })).toEqual({ postId })
    expect(() =>
      publicPostContentInput.parse({
        postId,
        filePath: "posts/unpublished/index.mdx",
      }),
    ).toThrow()
  })

  it("requires both the requested id and published state", () => {
    const postId = "1519ff60-fb32-43f0-ae85-d352311421cc"
    const database = drizzle.mock()
    const query = database
      .select({ id: posts.id })
      .from(posts)
      .where(publishedPostWhere(postId))
      .toSQL()

    expect(query.sql).toContain('"posts"."published" = $2')
    expect(query.params).toEqual([postId, true])
  })

  it("authorizes image storage access through a published canonical slug", () => {
    const slug = "published-post"
    const database = drizzle.mock()
    const query = database
      .select({ slug: posts.slug })
      .from(posts)
      .where(publishedPostSlugWhere(slug))
      .toSQL()

    expect(query.sql).toContain('"posts"."published" = $2')
    expect(query.params).toEqual([slug, true])
    expect(publicPostImageInput.parse({ slug, fileName: "123-header.png" })).toEqual({
      slug,
      fileName: "123-header.png",
    })
    expect(() => publicPostImageInput.parse({ slug, fileName: "../draft-secret.png" })).toThrow()
  })
})

describe("administrative post input boundaries", () => {
  const postId = "1519ff60-fb32-43f0-ae85-d352311421cc"

  it("enforces canonical slugs and a one-MiB UTF-8 content limit", () => {
    expect(
      adminPostContentInput.parse({
        id: postId,
        slug: "bounded-post",
        content: "a".repeat(MAX_POST_CONTENT_BYTES),
      }),
    ).toMatchObject({ id: postId, slug: "bounded-post" })

    expect(() =>
      adminPostContentInput.parse({
        id: postId,
        slug: "../draft",
        content: "safe",
      }),
    ).toThrow()
    expect(() =>
      adminPostContentInput.parse({
        id: postId,
        slug: "bounded-post",
        content: "a".repeat(MAX_POST_CONTENT_BYTES + 1),
      }),
    ).toThrow()
    expect(() =>
      adminPostContentInput.parse({
        id: postId,
        slug: "bounded-post",
        content: "é".repeat(MAX_POST_CONTENT_BYTES / 2 + 1),
      }),
    ).toThrow()
  })

  it("rejects unsafe and oversized file names", () => {
    expect(adminPostFileNameSchema.parse("header-image.webp")).toBe("header-image.webp")
    expect(() => adminPostFileNameSchema.parse("../header.png")).toThrow()
    expect(() => adminPostFileNameSchema.parse(".hidden.png")).toThrow()
    expect(() => adminPostFileNameSchema.parse(`${"a".repeat(252)}.png`)).toThrow()
  })

  it.each([
    ["image/gif", Buffer.from("GIF89a", "ascii")],
    ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    ["image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["image/webp", Buffer.from("RIFF0000WEBP", "ascii")],
  ] as const)("accepts %s only when its magic bytes match", (fileType, file) => {
    const parsed = adminPostImageInput.parse({
      slug: "bounded-post",
      fileName: "header.bin",
      fileType,
      fileData: file.toString("base64"),
    })

    expect(parsed.file.equals(file)).toBe(true)
  })

  it("rejects unsafe MIME types, mismatched magic bytes, malformed base64, and large images", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    expect(() =>
      adminPostImageInput.parse({
        slug: "bounded-post",
        fileName: "payload.svg",
        fileType: "image/svg+xml",
        fileData: Buffer.from("<svg><script /></svg>").toString("base64"),
      }),
    ).toThrow()
    expect(() => decodeAndValidatePostImage(png.toString("base64"), "image/jpeg")).toThrow()
    expect(() =>
      adminPostImageInput.parse({
        slug: "bounded-post",
        fileName: "header.png",
        fileType: "image/png",
        fileData: "not base64",
      }),
    ).toThrow()
    expect(() =>
      decodeAndValidatePostImage(
        Buffer.alloc(MAX_POST_IMAGE_BYTES + 1, 0x89).toString("base64"),
        "image/png",
      ),
    ).toThrow()
  })
})

describe("production auth origins", () => {
  it("does not trust development or sibling origins implicitly in production", () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousTrustedOrigins = process.env.TRUSTED_ORIGINS
    const previousDotdevBaseUrl = process.env.DOTDEV_BASE_URL
    const previousStudioBaseUrl = process.env.STUDIO_BASE_URL
    const previousBetterAuthUrl = process.env.BETTER_AUTH_URL
    const previousBaseUrl = process.env.BASE_URL

    process.env.NODE_ENV = "production"
    delete process.env.TRUSTED_ORIGINS
    delete process.env.DOTDEV_BASE_URL
    delete process.env.STUDIO_BASE_URL
    delete process.env.BETTER_AUTH_URL
    delete process.env.BASE_URL

    try {
      expect(getDotdevPublicBaseUrl()).toBe("https://dsqr.dev")
      expect(getDotdevTrustedOrigins()).toEqual(["https://dsqr.dev"])
      expect(getStudioPublicBaseUrl()).toBe("https://studio.dsqr.dev")
      expect(getStudioTrustedOrigins()).toEqual(["https://studio.dsqr.dev"])
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV
      } else {
        process.env.NODE_ENV = previousNodeEnv
      }
      if (previousTrustedOrigins === undefined) {
        delete process.env.TRUSTED_ORIGINS
      } else {
        process.env.TRUSTED_ORIGINS = previousTrustedOrigins
      }
      if (previousDotdevBaseUrl === undefined) {
        delete process.env.DOTDEV_BASE_URL
      } else {
        process.env.DOTDEV_BASE_URL = previousDotdevBaseUrl
      }
      if (previousStudioBaseUrl === undefined) {
        delete process.env.STUDIO_BASE_URL
      } else {
        process.env.STUDIO_BASE_URL = previousStudioBaseUrl
      }
      if (previousBetterAuthUrl === undefined) {
        delete process.env.BETTER_AUTH_URL
      } else {
        process.env.BETTER_AUTH_URL = previousBetterAuthUrl
      }
      if (previousBaseUrl === undefined) {
        delete process.env.BASE_URL
      } else {
        process.env.BASE_URL = previousBaseUrl
      }
    }
  })
})

describe("public DTOs", () => {
  it("returns comment ownership without returning account PII", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z")
    const updatedAt = new Date("2026-01-02T00:00:00.000Z")
    const internalRows = [
      {
        id: "comment-id",
        userId: "user-id",
        parentCommentId: null,
        content: "hello",
        createdAt,
        updatedAt,
        userName: "Reader",
        userImage: "https://example.invalid/avatar.png",
        userEmail: "must-not-be-returned@example.invalid",
        userRole: "admin",
        userBanned: false,
      },
    ]

    expect(buildPublicCommentTree(internalRows, "user-id")).toEqual([
      {
        id: "comment-id",
        parentCommentId: null,
        content: "hello",
        createdAt,
        updatedAt,
        userName: "Reader",
        userImage: "https://example.invalid/avatar.png",
        isOwner: true,
        replies: [],
      },
    ])
  })

  it("never projects or returns newsletter unsubscribe tokens", () => {
    expect(Object.keys(adminSubscriberSelection)).toEqual([
      "id",
      "email",
      "active",
      "subscribedAt",
      "unsubscribedAt",
    ])
    expect(subscriptionAccepted()).toEqual({ success: true })
  })

  it("returns the same response for duplicate subscriptions", () => {
    const duplicate = { code: "23505", detail: "not returned" }

    expect(isUniqueConstraintViolation(duplicate)).toBe(true)
    expect(handleSubscriptionError(duplicate)).toEqual(subscriptionAccepted())
  })

  it("maps other subscription failures to a generic server error", () => {
    expect(() => handleSubscriptionError({ code: "08006", detail: "not returned" })).toThrowError(
      expect.objectContaining({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to process subscription",
      }),
    )
  })
})
