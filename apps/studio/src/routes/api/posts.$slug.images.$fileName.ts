import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/posts/$slug/images/$fileName")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { slug, fileName } = params
        const imageUrl = `https://raw.githubusercontent.com/dsqr/blog-posts/main/${slug}/images/${fileName}`
        try {
          const response = await fetch(imageUrl)
          if (!response.ok) {
            return new Response("Image not found", { status: 404 })
          }
          return new Response(response.body, {
            headers: {
              "Content-Type":
                response.headers.get("Content-Type") || "image/png",
              "Cache-Control": "public, max-age=86400",
            },
          })
        } catch {
          return new Response("Failed to fetch image", { status: 500 })
        }
      },
    },
  },
})
