import { createFileRoute } from "@tanstack/react-router"

const githubUser = "0xdsqr"
const gitlabUser = "0xdsqr"

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

const cacheTtlMs = 10 * 60 * 1000
let cache: { payload: HistoryPayload; expiresAt: number } | null = null

async function fetchGithubDays(): Promise<Map<string, number> | null> {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${githubUser}?y=last`,
      { signal: AbortSignal.timeout(4000) },
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as {
      contributions?: Array<{ date: string; count: number }>
    }

    if (!Array.isArray(data.contributions)) {
      return null
    }

    return new Map(data.contributions.map((day) => [day.date, day.count]))
  } catch {
    return null
  }
}

async function fetchGitlabDays(): Promise<Map<string, number> | null> {
  try {
    const response = await fetch(`https://gitlab.com/users/${gitlabUser}/calendar.json`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as Record<string, number>

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return null
    }

    return new Map(
      Object.entries(data).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      ),
    )
  } catch {
    return null
  }
}

function quartileLevel(count: number, thresholds: [number, number, number]): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count <= thresholds[0]) return 1
  if (count <= thresholds[1]) return 2
  if (count <= thresholds[2]) return 3
  return 4
}

function buildPayload(
  github: Map<string, number> | null,
  gitlab: Map<string, number> | null,
): HistoryPayload {
  const merged: Array<{ date: string; count: number }> = []
  const today = new Date()

  for (let offset = 364; offset >= 0; offset--) {
    const day = new Date(today)
    day.setDate(day.getDate() - offset)
    const key = day.toISOString().slice(0, 10)
    merged.push({ date: key, count: (github?.get(key) ?? 0) + (gitlab?.get(key) ?? 0) })
  }

  const nonZero = merged
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b)
  const quantile = (fraction: number) =>
    nonZero.length === 0 ? 0 : nonZero[Math.floor((nonZero.length - 1) * fraction)]
  const thresholds: [number, number, number] = [quantile(0.25), quantile(0.5), quantile(0.75)]

  return {
    total: merged.reduce((sum, day) => sum + day.count, 0),
    days: merged.map((day) => ({ ...day, level: quartileLevel(day.count, thresholds) })),
    sources: { github: github !== null, gitlab: gitlab !== null },
    fetchedAt: new Date().toISOString(),
  }
}

export const Route = createFileRoute("/api/history")({
  server: {
    handlers: {
      GET: async () => {
        if (cache && cache.expiresAt > Date.now()) {
          return Response.json(cache.payload, { headers: { "Cache-Control": "no-store" } })
        }

        const [github, gitlab] = await Promise.all([fetchGithubDays(), fetchGitlabDays()])

        if (!github && !gitlab) {
          return Response.json(
            { error: "Upstream contribution sources unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          )
        }

        const payload = buildPayload(github, gitlab)
        cache = { payload, expiresAt: Date.now() + cacheTtlMs }

        return Response.json(payload, { headers: { "Cache-Control": "no-store" } })
      },
    },
  },
})
