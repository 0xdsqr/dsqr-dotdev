import { Link } from "@tanstack/react-router"

function Intro() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded overflow-hidden bg-muted mb-4 border border-border">
        <div className="w-full h-full">
          <img src="/me.jpeg" alt="0xdsqr" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="prose dark:prose-invert max-w-none text-center font-mono mt-4">
        <p className="text-sm sm:text-base leading-relaxed">
          Dad of one. Primarily focused on{" "}
          <span className="text-purple-600 dark:text-purple-400 border-b-2 border-dotted border-purple-600 dark:border-purple-400">
            infrastructure
          </span>
          ,{" "}
          <span className="text-teal-600 dark:text-teal-400 border-b-2 border-dotted border-teal-600 dark:border-teal-400">
            systems engineering
          </span>
          ,{" "}
          <span className="text-orange-600 dark:text-orange-300 border-b-2 border-dotted border-orange-400 dark:border-orange-300">
            cloud platforms
          </span>
          ,{" "}
          <span className="text-emerald-600 dark:text-emerald-400 border-b-2 border-dotted border-emerald-600 dark:border-emerald-400">
            developer tooling
          </span>
          , and{" "}
          <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-dotted border-indigo-600 dark:border-indigo-400">
            operations
          </span>
          . Currently building infrastructure and tooling at{" "}
          <span className="border-b-2 border-dotted border-foreground text-foreground">
            Stablecore
          </span>
          . Previously at{" "}
          <span className="border-b-2 border-dotted border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400">
            Goldman Sachs
          </span>
          . I also enjoy collecting things that are nice to look at.{" "}
          <Link
            to="/about"
            className="italic border-b-2 border-dotted border-purple-500 text-purple-500 dark:text-purple-400 font-medium"
          >
            More about me
          </Link>
        </p>
      </div>
    </div>
  )
}

export { Intro }
