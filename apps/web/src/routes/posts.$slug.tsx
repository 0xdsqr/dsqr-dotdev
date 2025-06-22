import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$slug')({
  component: Posts,
})

function Posts() {
  return (
    <div>
      Hello from Posts
    </div>
  )
}