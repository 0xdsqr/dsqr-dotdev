import { publicAppRouter } from "@dsqr-dotdev/api"
import { posts } from "@dsqr-dotdev/database/schema"
import { drizzle } from "drizzle-orm/node-postgres"
import { describe, expect, it } from "vitest"
import { adminAppRouter } from "../../../packages/api/src/api/admin"
import { publicPostImageInput, publishedPostSlugWhere } from "../../../packages/api/src/api/lib/s3"
import {
  buildPublicCommentTree,
  publicPostContentInput,
  publishedPostWhere,
} from "../../../packages/api/src/api/router/post"
import {
  adminSubscriberSelection,
  handleSubscriptionError,
  isUniqueConstraintViolation,
  subscriptionAccepted,
} from "../../../packages/api/src/api/router/email"
import { createAuthSurfacePlugins } from "../../../packages/api/src/auth"

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
    expect(createAuthSurfacePlugins("admin").map((plugin) => plugin.id)).toEqual(
      expect.arrayContaining(["admin", "organization"]),
    )
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
