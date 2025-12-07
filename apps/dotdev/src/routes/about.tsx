import { createFileRoute } from "@tanstack/react-router"
import { AboutPage } from "../components/about-page"

function About() {
  return <AboutPage />
}

export const Route = createFileRoute("/about")({
  component: About,
})
