import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button.js"

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div>
      <Button>Contact Meee</Button>
    </div>
  )
}