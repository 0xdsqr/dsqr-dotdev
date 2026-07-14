import { getPublishedPostImage } from "@dsqr-dotdev/api"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/posts/$slug/images/$fileName")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { slug, fileName } = params

        if (!slug || !fileName) {
          return new Response("Not found", { status: 404 })
        }

        let result: Awaited<ReturnType<typeof getPublishedPostImage>>
        try {
          result = await getPublishedPostImage(slug, fileName)
        } catch {
          return new Response("Unable to load image", {
            status: 500,
            headers: { "Cache-Control": "no-store" },
          })
        }

        if (!result) {
          return new Response("Not found", { status: 404 })
        }

        return new Response(result.body, {
          headers: {
            "Content-Type": result.contentType,
            "Cache-Control": "public, max-age=300, must-revalidate",
            // Defense in depth: never let the browser sniff a different type, and
            // sandbox the response so an uploaded SVG cannot execute script.
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
          },
        })
      },
    },
  },
})
