import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/misc')({
  component: Misc,
})

function Misc() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hello from Misc</h1>
    </div>
  )
}