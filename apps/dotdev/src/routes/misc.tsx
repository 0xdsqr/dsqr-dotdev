import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"
import { lazy, Suspense, useMemo, useState } from "react"
import {
  extractHeadingsFromMarkdown,
  OnThisPage,
} from "../components/on-this-page"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover"
import { useIsMobile } from "../hooks/use-mobile"

const BlogPostViewer = lazy(() =>
  import("../components/blog-post-viewer").then((mod) => ({
    default: mod.BlogPostViewer,
  })),
)

export const Route = createFileRoute("/misc")({
  loader: async ({ context }) => {
    return context.queryClient.fetchQuery(
      context.trpc.misc.gpgData.queryOptions(),
    )
  },
  component: MiscPage,
})

function MiscPage() {
  const { gpgKey, gpgFingerprint } = Route.useLoaderData() as {
    gpgKey: string
    gpgFingerprint: string
  }
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const content = `<h1 style="font-family: var(--font-mono); letter-spacing: 0.05em;" class="border-b-2 border-dotted border-border pb-2">GPG Key</h1>

\`\`\`
${gpgKey}
\`\`\`

## Fingerprint

\`\`\`
${gpgFingerprint}
\`\`\``

  const headings = useMemo(
    () => extractHeadingsFromMarkdown(content),
    [content],
  )

  return (
    <>
      <div className="py-8 max-w-3xl mx-auto relative">
        <div className="space-y-3">
          {isMobile && headings.length > 0 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-sm text-left border border-dotted border-border rounded flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="text-foreground font-medium">
                    On this page
                  </span>
                  <ChevronDown
                    className="w-4 h-4 opacity-50 transition-transform"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <div className="py-2">
                  <OnThisPage headings={headings} />
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Suspense
            fallback={<div className="text-muted-foreground">Loading...</div>}
          >
            <BlogPostViewer content={content} />
          </Suspense>
        </div>
      </div>

      {/* Desktop sidebar */}
      {headings.length > 0 && (
        <div className="hidden xl:block fixed right-8 top-24 h-[calc(100vh-6rem)] w-64 overflow-y-auto">
          <OnThisPage headings={headings} />
        </div>
      )}
    </>
  )
}
