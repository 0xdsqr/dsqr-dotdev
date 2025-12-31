import { getAvatar } from "@dsqr-dotdev/api"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/avatar/$userId/$fileName")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { userId, fileName } = params

        if (!userId || !fileName) {
          return new Response("Not found", { status: 404 })
        }

        const result = await getAvatar(userId, fileName)

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
