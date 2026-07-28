import { GitHubLogo } from "@dsqr-dotdev/react/components/brand-icons"
import { Globe } from "lucide-react"

export interface ProjectItem {
  name: string
  description: string
  repo?: string
  site?: string
  note?: string
}

export function ProjectList({ projects }: { projects: ProjectItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.name}
          className="group flex flex-col gap-3 rounded-sm border border-dotted border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
        >
          <p className="font-mono text-base font-semibold leading-tight transition-colors group-hover:text-primary">
            {project.name}
          </p>
          <p className="flex-1 text-sm leading-6 text-muted-foreground">{project.description}</p>
          <div className="flex items-center justify-between border-t border-dotted border-border pt-3">
            <div className="flex items-center gap-3">
              {project.repo ? (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.name} on GitHub`}
                  title="github repo"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <GitHubLogo className="size-4" />
                </a>
              ) : null}
              {project.site ? (
                <a
                  href={project.site}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.name} website`}
                  title="visit site"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Globe className="size-4" />
                </a>
              ) : null}
            </div>
            {project.note ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {project.note}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
