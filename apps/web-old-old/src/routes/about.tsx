import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hello from About</h1>
    </div>
  )
}