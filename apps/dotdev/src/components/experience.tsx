export interface ExperienceRole {
  title: string
  period: string
  location?: string
  client?: string
}

export interface ExperienceItem {
  company: string
  logo?: string
  roles: ExperienceRole[]
}

export function ExperienceTimeline({ items }: { items: ExperienceItem[] }) {
  return (
    <ol className="space-y-9">
      {items.map((item) => (
        <li key={item.company} className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-white">
            {item.logo ? (
              <img
                src={item.logo}
                alt={`${item.company} logo`}
                loading="lazy"
                decoding="async"
                className="size-full object-contain p-1.5"
              />
            ) : (
              <span className="font-mono text-base font-semibold text-neutral-500">
                {item.company.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-mono text-base font-semibold leading-tight">{item.company}</h3>
            <ul
              className={
                item.roles.length > 1
                  ? "mt-3 space-y-4 border-l-2 border-dotted border-border pl-4"
                  : "mt-2"
              }
            >
              {item.roles.map((role) => (
                <li key={role.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <p className="text-sm font-medium leading-6">{role.title}</p>
                    <p className="shrink-0 font-mono text-xs text-muted-foreground">
                      {role.period}
                    </p>
                  </div>
                  {role.location ? (
                    <p className="font-mono text-xs text-muted-foreground">{role.location}</p>
                  ) : null}
                  {role.client ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      <span aria-hidden="true">↳ </span>full-time, contracted to{" "}
                      <span className="text-foreground/80">{role.client}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  )
}
