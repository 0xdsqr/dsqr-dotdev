import { createFileRoute } from "@tanstack/react-router";
import { Intro } from "@/components/intro";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return <Intro />;
}
