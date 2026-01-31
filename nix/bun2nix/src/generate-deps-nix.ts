#!/usr/bin/env bun

/**
 * Generate bun.lock.nix from a Bun lockfile.
 *
 * Parses bun.lock (JSONC), resolves the transitive dependency closure
 * per workspace, and emits a Nix expression used by fetchBunDeps
 * to build an offline package cache for the Nix sandbox.
 *
 * Usage:
 *   bun run nix/bun2nix/src/generate-deps-nix.ts [path/to/bun.lock] [options]
 *
 * Options:
 *   --output, -o    Output file path (default: bun.lock.nix)
 *   --help, -h      Show help
 */

import {
  type BunLockfile,
  extractPackages,
  type PackageInfo,
  readLockfile,
} from "./lockfile"
import { getCachePath } from "./wyhash"

// ---------------------------------------------------------------------------
// Nix string escaping
// ---------------------------------------------------------------------------

const escapeNixString = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$")

// ---------------------------------------------------------------------------
// Workspace analysis
// ---------------------------------------------------------------------------

interface WorkspaceInfo {
  name: string
  path: string
  dependencies: string[]
  devDependencies: string[]
  resolvedPackages: string[] // transitive closure
}

/**
 * Build a map of package name -> resolved version from the lockfile.
 *
 * Note: if the lockfile contains multiple versions of the same package,
 * only the first encountered version is kept. Bun's flat package map
 * typically deduplicates to one version per name, so this is safe in
 * practice.
 */
const buildPackageResolutionMap = (
  lockfile: BunLockfile,
): Map<string, string> => {
  const resolutionMap = new Map<string, string>()

  for (const entry of Object.values(lockfile.packages || {})) {
    const resolved = entry[0]
    if (!resolved || resolved.startsWith("workspace:")) continue

    const lastAtIndex = resolved.lastIndexOf("@")
    if (lastAtIndex <= 0) continue

    const name = resolved.substring(0, lastAtIndex)
    const version = resolved.substring(lastAtIndex + 1)

    if (!resolutionMap.has(name)) {
      resolutionMap.set(name, version)
    }
  }

  return resolutionMap
}

/**
 * Build a dependency graph: package@version -> list of dependency names.
 */
const buildDependencyGraph = (lockfile: BunLockfile): Map<string, string[]> => {
  const graph = new Map<string, string[]>()

  for (const entry of Object.values(lockfile.packages || {})) {
    const resolved = entry[0]
    if (!resolved || resolved.startsWith("workspace:")) continue

    const meta = entry[2] as
      | { dependencies?: Record<string, string> }
      | undefined
    const deps = Object.keys(meta?.dependencies || {})

    graph.set(resolved, deps)
  }

  return graph
}

/**
 * Collect all workspace package names so we can skip them during
 * transitive resolution (they're local, not fetched from npm).
 */
const collectWorkspacePackageNames = (lockfile: BunLockfile): Set<string> => {
  const names = new Set<string>()
  for (const workspace of Object.values(lockfile.workspaces || {})) {
    const ws = workspace as { name?: string }
    if (ws.name) names.add(ws.name)
  }
  return names
}

/**
 * Resolve the transitive closure of dependencies for a list of direct deps.
 *
 * Skips workspace packages (local, not fetchable from npm).
 */
const resolveTransitiveDeps = (
  directDeps: string[],
  resolutionMap: Map<string, string>,
  depGraph: Map<string, string[]>,
  workspaceNames: Set<string>,
): string[] => {
  const resolved = new Set<string>()
  const queue: string[] = []

  for (const dep of directDeps) {
    if (workspaceNames.has(dep)) continue

    const version = resolutionMap.get(dep)
    if (version) {
      const key = `${dep}@${version}`
      if (!resolved.has(key)) {
        resolved.add(key)
        queue.push(key)
      }
    }
  }

  // BFS to resolve transitive deps
  while (queue.length > 0) {
    const current = queue.shift()!
    const deps = depGraph.get(current) || []

    for (const dep of deps) {
      const version = resolutionMap.get(dep)
      if (version) {
        const key = `${dep}@${version}`
        if (!resolved.has(key)) {
          resolved.add(key)
          queue.push(key)
        }
      }
    }
  }

  return Array.from(resolved).sort()
}

/**
 * Extract workspace metadata with resolved transitive dependencies.
 */
const extractWorkspaces = (
  lockfile: BunLockfile,
  resolutionMap: Map<string, string>,
  depGraph: Map<string, string[]>,
  workspaceNames: Set<string>,
): WorkspaceInfo[] => {
  const workspaces: WorkspaceInfo[] = []

  for (const [path, workspace] of Object.entries(lockfile.workspaces || {})) {
    const ws = workspace as {
      name?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    const dependencies = Object.keys(ws.dependencies || {})
    const devDependencies = Object.keys(ws.devDependencies || {})
    const allDeps = [...dependencies, ...devDependencies]

    const resolvedPackages = resolveTransitiveDeps(
      allDeps,
      resolutionMap,
      depGraph,
      workspaceNames,
    )

    workspaces.push({
      name: ws.name || path || "root",
      path: path || "",
      dependencies,
      devDependencies,
      resolvedPackages,
    })
  }

  return workspaces.sort((a, b) => a.path.localeCompare(b.path))
}

// ---------------------------------------------------------------------------
// Nix expression generation
// ---------------------------------------------------------------------------

const generateNix = (
  packages: PackageInfo[],
  workspaces: WorkspaceInfo[],
  lockfileVersion: number,
): string => {
  const lines: string[] = [
    "# AUTO-GENERATED by generate-deps-nix - DO NOT EDIT",
    `# Generated from bun.lock (version ${lockfileVersion})`,
    `# Generated at: ${new Date().toISOString()}`,
    "#",
    "# To regenerate:",
    "#   nix run .#generate-deps",
    "#",
    "{",
    `  lockfileVersion = ${lockfileVersion};`,
    `  packageCount = ${packages.length};`,
    `  workspaceCount = ${workspaces.length};`,
    "",
    "  workspaces = {",
  ]

  for (const ws of workspaces) {
    const pathKey = ws.path === "" ? "root" : ws.path.replace(/\//g, "-")
    lines.push(`    "${escapeNixString(pathKey)}" = {`)
    lines.push(`      name = "${escapeNixString(ws.name)}";`)
    lines.push(`      path = "${escapeNixString(ws.path)}";`)

    const formatList = (items: string[]): string =>
      items.length > 0
        ? `[\n${items
            .sort()
            .map((d) => `        "${escapeNixString(d)}"`)
            .join("\n")}\n      ]`
        : "[ ]"

    lines.push(`      dependencies = ${formatList(ws.dependencies)};`)
    lines.push(`      devDependencies = ${formatList(ws.devDependencies)};`)

    lines.push(`      resolvedPackageCount = ${ws.resolvedPackages.length};`)
    lines.push(`      resolvedPackages = ${formatList(ws.resolvedPackages)};`)

    lines.push("    };")
  }

  lines.push("  };")
  lines.push("")
  lines.push("  packages = {")

  for (const pkg of packages) {
    const key = `${pkg.name}@${pkg.version}`
    lines.push(`    "${escapeNixString(key)}" = {`)
    lines.push(`      name = "${escapeNixString(pkg.name)}";`)
    lines.push(`      version = "${escapeNixString(pkg.version)}";`)
    lines.push(`      url = "${escapeNixString(pkg.url)}";`)
    lines.push(`      integrity = "${escapeNixString(pkg.integrity)}";`)
    lines.push(`      cachePath = "${escapeNixString(pkg.cachePath)}";`)
    lines.push("    };")
  }

  lines.push("  };")
  lines.push("}")
  lines.push("")

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const printHelp = (): void => {
  console.log(`
generate-deps-nix - Generate bun.lock.nix from bun.lock

Usage:
  generate-deps-nix [path/to/bun.lock] [options]

Options:
  --output, -o    Output file path (default: bun.lock.nix)
  --help, -h      Show help
`)
}

const main = async (): Promise<void> => {
  const args = Bun.argv.slice(2)

  if (args.includes("-h") || args.includes("--help")) {
    printHelp()
    process.exit(0)
  }

  const outputIdx = args.findIndex((a) => a === "-o" || a === "--output")
  const outputPath =
    outputIdx !== -1 ? (args[outputIdx + 1] ?? "bun.lock.nix") : "bun.lock.nix"

  const lockfilePath =
    args.find((a) => !a.startsWith("-") && a !== outputPath) ?? "bun.lock"

  console.log(`Parsing ${lockfilePath}...`)

  const lockData = await readLockfile(lockfilePath).catch(() => {
    console.error(`Error: Could not read lockfile at ${lockfilePath}`)
    process.exit(1)
  })

  const packages = extractPackages(lockData, getCachePath)
  const resolutionMap = buildPackageResolutionMap(lockData)
  const depGraph = buildDependencyGraph(lockData)
  const workspaceNames = collectWorkspacePackageNames(lockData)
  const workspaces = extractWorkspaces(
    lockData,
    resolutionMap,
    depGraph,
    workspaceNames,
  )

  console.log(`Found ${packages.length} packages`)
  console.log(`Found ${workspaces.length} workspaces`)

  for (const ws of workspaces) {
    const label = ws.path === "" ? "root" : ws.path
    console.log(`  ${label}: ${ws.resolvedPackages.length} resolved packages`)
  }

  const nixContent = generateNix(packages, workspaces, lockData.lockfileVersion)
  await Bun.write(outputPath, nixContent)
  console.log(`Generated ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
