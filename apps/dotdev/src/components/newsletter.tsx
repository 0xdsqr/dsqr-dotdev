import { Link } from "@tanstack/react-router"

function Newsletter() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="w-16 h-16 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted">
        <img
          src="/me-ghibli.png"
          alt="0xdsqr"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="prose dark:prose-invert max-w-none text-center">
        <p className="text-sm sm:text-base leading-relaxed">
          Dad of one. Interested in{" "}
          <span className="text-teal-600 dark:text-teal-400 border-b-2 border-dotted border-teal-600 dark:border-teal-400">
            servers/
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-dotted border-indigo-600 dark:border-indigo-400">
            (less)
          </span>
          , developer workflows, and{" "}
          <span className="italic border-b-2 border-dotted border-orange-400 text-orange-600 dark:text-orange-300">
            &quot;the cloud&quot;
          </span>
          .{" "}
          <Link
            to="/about"
            className="italic border-b-2 border-dotted border-purple-500 text-purple-500 dark:text-purple-400 font-medium"
          >
            More About Me
          </Link>
        </p>
        <p className="mt-4 text-sm sm:text-base">
          I also write sometimes. Stay connected if you want.
        </p>
      </div>
    </div>
  )
}

export { Newsletter }
