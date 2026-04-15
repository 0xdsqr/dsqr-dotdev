import { createFileRoute } from "@tanstack/react-router"
import { MessageSquare, PenLine, Share2, Twitter } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/_authenticated/social/")({
  component: SocialPage,
})

function SocialPage() {
  return (
    <>
      <SiteHeader breadcrumbs={[{ label: "Content", href: "/" }, { label: "Social" }]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compose and schedule posts across your social channels.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Twitter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Twitter/X</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Compose threads, schedule tweets, and track engagement.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Bluesky</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Cross-post content to Bluesky with formatting.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Cross-Post</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Publish to multiple platforms simultaneously.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <PenLine className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            The social module will let you compose, schedule, and cross-post content from a single
            interface.
          </p>
        </div>
      </div>
    </>
  )
}
