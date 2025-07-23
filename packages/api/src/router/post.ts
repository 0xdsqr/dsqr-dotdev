import { z } from "zod/v4"
import { router, publicProcedure } from "../trpc"

const mockPosts = [
  {
    id: "1",
    title: "Welcome to dsqr.dev",
    slug: "welcome-to-dsqr-dev",
    description: "A brief introduction to my personal blog and projects",
    content: "Welcome to my personal blog...",
    category: "general",
    tags: ["welcome", "intro"],
    published: true,
    featured: true,
    readingTime: 5,
    likes: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

const postRouter = router({
  all: publicProcedure.query(() => {
    return mockPosts
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      return mockPosts.find((post) => post.slug === input.slug) || null
    }),
})

export { postRouter }