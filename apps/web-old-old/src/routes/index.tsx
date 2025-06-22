import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hello from Index</h1>
    </div>
  )
}