import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  component: Posts,
})

function Posts() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hello from Posts</h1>
    </div>
  )
}