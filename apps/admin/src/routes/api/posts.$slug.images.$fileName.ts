import { getPostImage } from "@dsqr-dotdev/api"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/posts/$slug/images/$fileName")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { slug, fileName } = params

        if (!slug || !fileName) {
          return new Response("Not found", { status: 404 })
        }

        const result = await getPostImage(slug, fileName)

        if (!result) {
          return new Response("Not found", { status: 404 })
        }

        return new Response(result.body, {
          headers: {
            "Content-Type": result.contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      },
    },
  },
})
