import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/misc')({
  component: Misc,
})

function Misc() {
  return (
    <div>
      Hello from Misc
    </div>
  )
}