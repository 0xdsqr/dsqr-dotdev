import { createFileRoute } from "@tanstack/react-router";

function About() {
  return <div>about</div>;
}

export const Route = createFileRoute("/about")({
  component: About,
});
