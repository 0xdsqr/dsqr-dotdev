import { Link } from "@tanstack/react-router"

function Intro() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded overflow-hidden bg-muted mb-4 border border-border">
        <img
          src="/me.jpeg"
          alt="0xdsqr"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="prose dark:prose-invert max-w-none text-center font-mono mt-4">
        <p className="text-sm sm:text-base leading-relaxed">
          Dad of one. Interested in{" "}
          <span className="text-teal-600 dark:text-teal-400 border-b-2 border-dotted border-teal-600 dark:border-teal-400">
            servers/
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-dotted border-indigo-600 dark:border-indigo-400">
            (less)
          </span>
          ,{" "}
          <span className="text-emerald-600 dark:text-emerald-400 border-b-2 border-dotted border-emerald-600 dark:border-emerald-400">
            developer workflows
          </span>
          ,{" "}
          <span className="text-rose-600 dark:text-rose-400 border-b-2 border-dotted border-rose-600 dark:border-rose-400">
            distributed systems
          </span>
          , and{" "}
          <span className="italic border-b-2 border-dotted border-orange-400 text-orange-600 dark:text-orange-300">
            &quot;the cloud&quot;
          </span>
          . Currently building things at Goldman Sachs as a Vice President,
          software engineer on the cloud platform team.{" "}
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
