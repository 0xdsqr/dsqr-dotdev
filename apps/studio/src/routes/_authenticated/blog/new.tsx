import { createFileRoute } from "@tanstack/react-router"
import { BlogEditor } from "@/components/blog-editor"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/_authenticated/blog/new")({
  component: NewPostPage,
})

function NewPostPage() {
  return (
    <>
      <SiteHeader
        breadcrumbs={[
          { label: "Content", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "New Post" },
        ]}
      />
      <div className="flex flex-1 flex-col p-6">
        <BlogEditor />
      </div>
    </>
  )
}
