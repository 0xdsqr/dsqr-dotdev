import { createFileRoute } from "@tanstack/react-router"

function About() {
  return (
    <div className="pb-12">
      <section className="space-y-4 max-w-3xl mx-auto mt-16 px-4">
        <h2 className="text-2xl font-semibold font-mono mb-6">
          <span className="text-purple-600 dark:text-purple-400">→</span> Bio
        </h2>
        <div className="prose dark:prose-invert max-w-none font-mono text-sm leading-relaxed space-y-4">
          <p>
            Hi! I'm Dave Dennis, a software engineer specializing in internal
            platforms, developer tooling, and cloud enablement based in{" "}
            <span className="bg-blue-100 dark:bg-blue-900/30 px-2 rounded text-blue-900 dark:text-blue-200">
              Dallas, TX
            </span>
            . As Vice President, Software Engineer at{" "}
            <span className="bg-blue-100 dark:bg-blue-900/30 px-2 rounded text-blue-900 dark:text-blue-200">
              Goldman Sachs
            </span>
            , I enable others to design and build cool stuff in the cloud.
          </p>
          <p>
            I spend my time thinking about{" "}
            <span className="text-teal-600 dark:text-teal-400 border-b-2 border-dotted border-teal-600 dark:border-teal-400">
              distributed systems
            </span>
            ,{" "}
            <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-dotted border-indigo-600 dark:border-indigo-400">
              cloud platforms
            </span>
            ,{" "}
            <span className="text-emerald-600 dark:text-emerald-400 border-b-2 border-dotted border-emerald-600 dark:border-emerald-400">
              developer workflows
            </span>
            , and building tools that simplify complex processes through
            automation and intuitive tooling.
          </p>
          <p>
            Outside of work, I'm a dad to David Wayne Dennis III and spend most
            of my free time with him and my wife. We're into{" "}
            <span className="bg-orange-100 dark:bg-orange-900/30 px-2 rounded text-orange-900 dark:text-orange-200">
              Path of Exile
            </span>{" "}
            and{" "}
            <span className="bg-pink-100 dark:bg-pink-900/30 px-2 rounded text-pink-900 dark:text-pink-200">
              Valorant
            </span>{" "}
            (I'm bad at Valorant but love it anyway).
          </p>
        </div>
      </section>
    </div>
  )
}

export const Route = createFileRoute("/about")({
  component: About,
})
