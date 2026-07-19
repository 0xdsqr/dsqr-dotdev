import { Link } from "@tanstack/react-router"

function Intro() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
      <div className="size-20 overflow-hidden rounded-md border border-border bg-muted shadow-sm md:size-24">
        <img src="/me.jpeg" alt="0xdsqr" className="size-full object-cover" />
      </div>

      <div className="mt-7 space-y-5 font-mono text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
        <div className="space-y-2">
          <p>
            Dad of one. I&apos;m primarily interested in{" "}
            <span className="text-purple-600 underline decoration-purple-600/50 decoration-2 decoration-dotted underline-offset-4 dark:text-purple-400 dark:decoration-purple-400/50">
              infrastructure
            </span>
            ,{" "}
            <span className="text-teal-600 underline decoration-teal-600/50 decoration-2 decoration-dotted underline-offset-4 dark:text-teal-400 dark:decoration-teal-400/50">
              systems
            </span>
            ,{" "}
            <span className="text-orange-600 underline decoration-orange-600/50 decoration-2 decoration-dotted underline-offset-4 dark:text-orange-300 dark:decoration-orange-300/50">
              platforms
            </span>
            ,{" "}
            <span className="text-emerald-600 underline decoration-emerald-600/50 decoration-2 decoration-dotted underline-offset-4 dark:text-emerald-400 dark:decoration-emerald-400/50">
              making things fast
            </span>
            , and{" "}
            <span className="text-indigo-600 underline decoration-indigo-600/50 decoration-2 decoration-dotted underline-offset-4 dark:text-indigo-400 dark:decoration-indigo-400/50">
              operations
            </span>
            .
          </p>

          <p>
            Currently building infrastructure and systems at{" "}
            <span className="font-medium text-foreground underline decoration-border decoration-2 decoration-dotted underline-offset-4">
              Stablecore
            </span>
            .
          </p>
        </div>

        <p>
          I also enjoy hardware, Nix, and collecting things that are nice to look at.{" "}
          <Link
            to="/about"
            className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.14em] text-primary underline decoration-dotted underline-offset-4 transition-colors hover:text-primary/75"
          >
            more about me &rarr;
          </Link>
        </p>
      </div>
    </div>
  )
}

export { Intro }
