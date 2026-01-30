import { createFileRoute } from "@tanstack/react-router"
import { SiteHeader } from "@/components/site-header"
import { BlogEditor } from "@/components/blog-editor"

export const Route = createFileRoute("/blog/new")({
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
