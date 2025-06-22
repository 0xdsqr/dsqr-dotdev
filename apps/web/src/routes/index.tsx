import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button.js"

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to my site</h1>
      <div className="flex gap-4">
        <Button>
          <Link to="/posts">Read Blog</Link>
        </Button>
        <Button>
          <Link to="/about">About Me</Link>
        </Button>
      </div>
    </div>
  )
}