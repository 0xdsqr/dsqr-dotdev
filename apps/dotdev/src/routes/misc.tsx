import { CodeBox } from "@dsqr-dotdev/react/components/code-box"
import { SectionHeading } from "@dsqr-dotdev/react/components/section-heading"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PageSection } from "@/components/page-section"
import { SectionRail } from "@/components/section-rail"
import { cn } from "@/lib/utils"

const gpgFingerprint = "2885 E3DB B899 5B0C 0B43 8441 6908 FE14 2198 DB65"
const gpgKeyUrl = "https://cdn.dsqr.dev/misc/0xdsqr.asc"
const githubUrl = "https://github.com/0xdsqr"
const gitlabUrl = "https://gitlab.com/0xdsqr"

const miscSections = [
  { id: "gpg", label: "gpg" },
  { id: "health", label: "health" },
  { id: "contributions", label: "commits" },
  { id: "colophon", label: "site" },
]

type HistoryDay = {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

type HistoryPayload = {
  total: number
  days: HistoryDay[]
  sources: { github: boolean; gitlab: boolean }
  fetchedAt: string
}

type HealthPayload = {
  status: "ok" | "degraded"
  components: Array<{ id: string; label: string; ok: boolean; latencyMs: number }>
  timestamp: string
}

export const Route = createFileRoute("/misc")({
  loader: async () => {
    try {
      const response = await fetch(gpgKeyUrl, {
        headers: {
          Accept: "application/pgp-keys, text/plain;q=0.9, */*;q=0.1",
        },
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        return { armoredPublicKey: null }
      }

      return { armoredPublicKey: await response.text() }
    } catch {
      return { armoredPublicKey: null }
    }
  },
  component: MiscPage,
})

function MiscPage() {
  const { armoredPublicKey } = Route.useLoaderData()

  return (
    <>
      <SectionRail sections={miscSections} />

      <div className="space-y-14">
        <div className="space-y-3">
          <SectionHeading as="h1">misc</SectionHeading>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            A running log of odds and ends.
          </p>
        </div>

        <PageSection id="gpg" title="gpg">
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Verify something I signed, or encrypt something only I should read.
          </p>
          <CodeBox label="fingerprint" value={gpgFingerprint} />
          {armoredPublicKey ? <CodeBox label="public key" value={armoredPublicKey} /> : null}
          <a
            href={gpgKeyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block border-b border-dotted border-primary font-mono text-sm text-primary transition-opacity hover:opacity-80"
          >
            download 0xdsqr.asc ↓
          </a>
        </PageSection>

        <PageSection id="health" title="site health">
          <HealthPanel />
        </PageSection>

        <PageSection id="contributions" title="contributions">
          <ContributionsGraph />
        </PageSection>

        <PageSection id="colophon" title="about this site" last>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            This site is a TanStack Start app with tRPC and Postgres behind it, styled with
            Tailwind, built into images with Nix, and served from a k3s cluster I run myself. Source
            lives at{" "}
            <a
              href="https://github.com/0xdsqr/dsqr-dotdev"
              target="_blank"
              rel="noreferrer"
              className="border-b border-dotted border-primary text-primary transition-opacity hover:opacity-80"
            >
              0xdsqr/dsqr-dotdev
            </a>
            .
          </p>
        </PageSection>
      </div>
    </>
  )
}

function HealthPanel() {
  const healthQuery = useQuery({
    queryKey: ["site-health"],
    queryFn: async () => {
      const response = await fetch("/api/health", { signal: AbortSignal.timeout(5000) })
      if (!response.ok) {
        throw new Error("unhealthy")
      }
      return response.json() as Promise<HealthPayload>
    },
    refetchInterval: 30_000,
    retry: 1,
  })

  const health = healthQuery.data
  const reachable = !healthQuery.isError
  const allOk = reachable && health?.status === "ok"

  return (
    <div className="max-w-2xl space-y-4">
      <span className="inline-flex items-center gap-2 font-mono text-sm">
        <span className="relative flex size-2.5">
          {allOk ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          ) : null}
          <span
            className={cn(
              "relative inline-flex size-2.5 rounded-full",
              allOk ? "bg-emerald-500" : "bg-destructive",
            )}
          />
        </span>
        <span className={allOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
          {allOk
            ? "all systems operational"
            : reachable
              ? "partially degraded"
              : "site unreachable"}
        </span>
      </span>

      <div className="grid gap-2 sm:grid-cols-3">
        {(
          health?.components ?? [
            { id: "web", label: "web", ok: reachable, latencyMs: 0 },
            { id: "database", label: "database", ok: false, latencyMs: 0 },
            { id: "cdn", label: "cdn", ok: false, latencyMs: 0 },
          ]
        ).map((component) => (
          <div
            key={component.id}
            className="flex items-center justify-between gap-2 rounded-md border border-dotted border-border px-3 py-2 font-mono text-xs"
          >
            <span className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  component.ok ? "bg-emerald-500" : "bg-destructive",
                )}
              />
              <span className={component.ok ? "text-foreground" : "text-destructive"}>
                {component.label}
              </span>
            </span>
            <span className="text-muted-foreground">
              {component.ok
                ? component.latencyMs > 0
                  ? `${component.latencyMs}ms`
                  : "up"
                : "down"}
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        checked live every 30s
        {health?.timestamp
          ? ` · last check ${new Date(health.timestamp).toLocaleTimeString("en-US")}`
          : ""}
      </p>
    </div>
  )
}

const contributionLevelClasses = [
  "bg-muted",
  "bg-primary/25",
  "bg-primary/50",
  "bg-primary/75",
  "bg-primary",
] as const

function ContributionsGraph() {
  const historyQuery = useQuery({
    queryKey: ["contribution-history"],
    queryFn: async () => {
      const response = await fetch("/api/history", { signal: AbortSignal.timeout(8000) })
      if (!response.ok) {
        throw new Error("history unavailable")
      }
      return response.json() as Promise<HistoryPayload>
    },
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  })

  const history = historyQuery.data

  if (historyQuery.isPending) {
    return <p className="font-mono text-xs text-muted-foreground">loading contribution history…</p>
  }

  if (!history) {
    return (
      <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
        Couldn&apos;t load contribution history right now — see{" "}
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="border-b border-dotted border-primary text-primary transition-opacity hover:opacity-80"
        >
          github
        </a>{" "}
        or{" "}
        <a
          href={gitlabUrl}
          target="_blank"
          rel="noreferrer"
          className="border-b border-dotted border-primary text-primary transition-opacity hover:opacity-80"
        >
          gitlab
        </a>
        .
      </p>
    )
  }

  const firstDayOffset = new Date(`${history.days[0].date}T00:00:00`).getDay()
  const padding = Array.from({ length: firstDayOffset }, (_, index) => index)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-[2px]">
          {padding.map((index) => (
            <span key={`pad-${index}`} className="size-2.5" />
          ))}
          {history.days.map((day) => (
            <span
              key={day.date}
              title={`${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`}
              className={cn(
                "size-2.5 rounded-[2px]",
                contributionLevelClasses[day.level] ?? contributionLevelClasses[0],
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
        <span>{history.total.toLocaleString("en-US")} contributions in the last year</span>
        <span className="inline-flex items-center gap-1.5">
          less
          {contributionLevelClasses.map((levelClass) => (
            <span key={levelClass} className={cn("size-2.5 rounded-[2px]", levelClass)} />
          ))}
          more
        </span>
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        combined activity from{" "}
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="border-b border-dotted border-border transition-colors hover:text-foreground"
        >
          github
        </a>
        {" + "}
        <a
          href={gitlabUrl}
          target="_blank"
          rel="noreferrer"
          className="border-b border-dotted border-border transition-colors hover:text-foreground"
        >
          gitlab
        </a>
        {history.sources.github && history.sources.gitlab
          ? ""
          : history.sources.github
            ? " (gitlab unavailable right now)"
            : " (github unavailable right now)"}
      </p>
    </div>
  )
}
