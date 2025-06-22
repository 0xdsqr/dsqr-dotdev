import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/posts/$slug')({
  component: Post,
})

function Post() {
  const { slug } = Route.useParams()
    
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {"slug is " + slug}
    </div>
  )
}