#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { appendFileSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const root = resolve(process.env.CI_REPO_ROOT ?? process.cwd())
const appRegistry = JSON.parse(readFileSync(join(root, "nix/ci/apps.json"), "utf8"))
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]

const parseArguments = (arguments_) => {
  const options = { base: undefined, head: "HEAD", githubOutput: undefined, json: false }

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    if (argument === "--base") options.base = arguments_[index += 1]
    else if (argument === "--head") options.head = arguments_[index += 1]
    else if (argument === "--github-output") options.githubOutput = arguments_[index += 1]
    else if (argument === "--json") options.json = true
    else throw new Error(`Unknown argument: ${argument}`)
  }

  if (!options.base) throw new Error("--base is required")
  return options
}

const git = (...arguments_) =>
  execFileSync("git", arguments_, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })

const readRevisionFile = (revision, path) => {
  try {
    return git("show", `${revision}:${path}`)
  } catch {
    return undefined
  }
}

const parseJsonAtRevision = (revision, path) => {
  const contents = readRevisionFile(revision, path)
  return contents === undefined ? undefined : JSON.parse(contents)
}

const normalizeDependencies = (dependencies, internalNames) =>
  Object.fromEntries(
    Object.entries(dependencies ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, version]) => [name, internalNames.has(name) ? "0.0.0" : version]),
  )

const normalizeManifest = (manifest, internalNames) => {
  if (!manifest) return manifest
  const normalized = structuredClone(manifest)
  normalized.version = "0.0.0"
  for (const field of dependencyFields) {
    if (field in normalized) {
      normalized[field] = normalizeDependencies(normalized[field], internalNames)
    }
  }
  return normalized
}

const isWorkspaceLockPath = (path) =>
  /^(apps|packages)\/[^/]+$/.test(path)

const normalizeLock = (lock, internalNames) => {
  if (!lock) return lock
  const normalized = structuredClone(lock)
  normalized.version = "0.0.0"
  if (normalized.packages?.[""]) normalized.packages[""].version = "0.0.0"

  for (const [path, package_] of Object.entries(normalized.packages ?? {})) {
    if (!isWorkspaceLockPath(path)) continue
    package_.version = "0.0.0"
    for (const field of dependencyFields) {
      if (field in package_) {
        package_[field] = normalizeDependencies(package_[field], internalNames)
      }
    }
  }

  return normalized
}

const stableJson = (value) => {
  const sort = (current) => {
    if (Array.isArray(current)) return current.map(sort)
    if (current && typeof current === "object") {
      return Object.fromEntries(
        Object.entries(current)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, sort(child)]),
      )
    }
    return current
  }
  return JSON.stringify(sort(value))
}

const listWorkspaceManifests = (revision) => {
  const paths = git("ls-tree", "-r", "--name-only", revision)
    .split("\n")
    .filter((path) => /^(apps|packages)\/[^/]+\/package\.json$/.test(path))

  return paths.map((path) => ({
    path: dirname(path),
    manifest: parseJsonAtRevision(revision, path),
  }))
}

const buildWorkspaceGraph = (revision) => {
  const workspaces = listWorkspaceManifests(revision)
  const nameToWorkspace = new Map(
    workspaces
      .filter(({ manifest }) => manifest?.name)
      .map(({ path, manifest }) => [manifest.name, path]),
  )
  const reverseDependencies = new Map(
    [...nameToWorkspace.keys()].map((name) => [name, new Set()]),
  )

  for (const { manifest } of workspaces) {
    if (!manifest?.name) continue
    for (const field of dependencyFields) {
      for (const dependencyName of Object.keys(manifest[field] ?? {})) {
        if (nameToWorkspace.has(dependencyName)) {
          reverseDependencies.get(dependencyName).add(manifest.name)
        }
      }
    }
  }

  return { nameToWorkspace, reverseDependencies, workspaces }
}

const mergeWorkspaceGraphs = (base, head) => {
  const graphs = [buildWorkspaceGraph(base), buildWorkspaceGraph(head)]
  const workspaces = [
    ...new Map(
      graphs
        .flatMap(({ workspaces: entries }) => entries)
        .map((workspace) => [workspace.path, workspace]),
    ).values(),
  ]
  const nameToWorkspace = new Map(
    workspaces
      .filter(({ manifest }) => manifest?.name)
      .map(({ path, manifest }) => [manifest.name, path]),
  )
  const reverseDependencies = new Map(
    [...nameToWorkspace.keys()].map((name) => [name, new Set()]),
  )

  for (const graph of graphs) {
    for (const [name, dependents] of graph.reverseDependencies) {
      const merged = reverseDependencies.get(name) ?? new Set()
      for (const dependent of dependents) merged.add(dependent)
      reverseDependencies.set(name, merged)
    }
  }

  return { nameToWorkspace, reverseDependencies, workspaces }
}

const changedPaths = (base, head) => {
  const output = execFileSync("git", ["diff", "--name-status", "-z", base, head], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
  const fields = output.split("\0")
  const paths = []

  for (let index = 0; index < fields.length - 1; ) {
    const status = fields[index++]
    if (status.startsWith("R") || status.startsWith("C")) {
      paths.push(fields[index++], fields[index++])
    } else {
      paths.push(fields[index++])
    }
  }

  return [...new Set(paths.filter(Boolean))].sort()
}

const isSemanticManifestChange = (path, base, head, internalNames) => {
  const before = parseJsonAtRevision(base, path)
  const after = parseJsonAtRevision(head, path)
  return (
    stableJson(normalizeManifest(before, internalNames)) !==
    stableJson(normalizeManifest(after, internalNames))
  )
}

const isSemanticLockChange = (base, head, internalNames) =>
  stableJson(normalizeLock(parseJsonAtRevision(base, "package-lock.json"), internalNames)) !==
  stableJson(normalizeLock(parseJsonAtRevision(head, "package-lock.json"), internalNames))

const normalizeChartReleaseFields = (contents) =>
  contents
    ?.replace(/^version:\s*.+$/m, "version: 0.0.0")
    .replace(/^appVersion:\s*.+$/m, "appVersion: 0.0.0")

const normalizeImageFields = (contents) => {
  if (contents === undefined) return undefined
  const lines = contents.split("\n")
  let imageIndent
  return lines
    .map((line) => {
      const imageMatch = line.match(/^(\s*)image:\s*$/)
      if (imageMatch) {
        imageIndent = imageMatch[1].length
        return line
      }
      if (imageIndent === undefined) return line

      const match = line.match(/^(\s*)(version|digest):\s*.+$/)
      if (match && match[1].length > imageIndent) {
        return `${match[1]}${match[2]}: <release-value>`
      }
      if (line.trim() !== "" && (line.match(/^\s*/)?.[0].length ?? 0) <= imageIndent) {
        imageIndent = undefined
      }
      return line
    })
    .join("\n")
}

const isGeneratedReleaseChange = (path, base, head, internalNames) => {
  if (path.startsWith(".changeset/") || /^(apps|packages)\/.+\/CHANGELOG\.md$/.test(path)) {
    return true
  }
  if (path === "package-lock.json") return !isSemanticLockChange(base, head, internalNames)
  if (path === "package.json" || /^(apps|packages)\/.+\/package\.json$/.test(path)) {
    return !isSemanticManifestChange(path, base, head, internalNames)
  }
  if (/^helm\/[^/]+\/Chart\.yaml$/.test(path)) {
    return (
      normalizeChartReleaseFields(readRevisionFile(base, path)) ===
      normalizeChartReleaseFields(readRevisionFile(head, path))
    )
  }
  if (/^helm\/[^/]+\/values-prod\.yaml$/.test(path)) {
    return (
      normalizeImageFields(readRevisionFile(base, path)) ===
      normalizeImageFields(readRevisionFile(head, path))
    )
  }
  return false
}

const plan = ({ base, head }) => {
  git("cat-file", "-e", `${base}^{commit}`)
  git("cat-file", "-e", `${head}^{commit}`)

  const graph = mergeWorkspaceGraphs(base, head)
  const internalNames = new Set(graph.nameToWorkspace.keys())
  const paths = changedPaths(base, head)
  const selected = new Set()
  const reasons = new Map()
  let materialManifestChange = false
  let materialLockChange = false
  let workspaceTypecheck = false

  const addApp = (app, reason) => {
    selected.add(app)
    const appReasons = reasons.get(app) ?? new Set()
    appReasons.add(reason)
    reasons.set(app, appReasons)
  }
  const addAll = (reason) => {
    for (const { app } of appRegistry) addApp(app, reason)
  }
  const addWorkspaceConsumers = (workspacePath, reason) => {
    const workspace = graph.workspaces.find(({ path }) => path === workspacePath)
    if (!workspace?.manifest?.name) return

    const queue = [workspace.manifest.name]
    const visited = new Set()
    while (queue.length > 0) {
      const name = queue.shift()
      if (visited.has(name)) continue
      visited.add(name)
      for (const app of appRegistry) {
        const appManifest = graph.workspaces.find(({ path }) => path === app.workspace)?.manifest
        if (appManifest?.name === name) addApp(app.app, reason)
      }
      for (const dependent of graph.reverseDependencies.get(name) ?? []) queue.push(dependent)
    }
  }

  for (const path of paths) {
    if (path === "package-lock.json") {
      materialLockChange = isSemanticLockChange(base, head, internalNames)
      if (materialLockChange) {
        workspaceTypecheck = true
        addAll("material dependency lock change")
      }
      continue
    }

    if (path === "package.json" || /^(apps|packages)\/.+\/package\.json$/.test(path)) {
      if (!isSemanticManifestChange(path, base, head, internalNames)) continue
      materialManifestChange = true
      workspaceTypecheck = true
    }

    if (path.startsWith(".changeset/") || /^(apps|packages)\/.+\/CHANGELOG\.md$/.test(path)) {
      continue
    }

    const directApp = appRegistry.find(
      ({ workspace }) => path === workspace || path.startsWith(`${workspace}/`),
    )
    if (directApp) {
      addApp(directApp.app, path)
      workspaceTypecheck = true
      continue
    }

    const workspace = graph.workspaces
      .map(({ path: workspacePath }) => workspacePath)
      .sort((left, right) => right.length - left.length)
      .find((workspacePath) => path === workspacePath || path.startsWith(`${workspacePath}/`))
    if (workspace) {
      workspaceTypecheck = true
      addWorkspaceConsumers(workspace, path)
      continue
    }

    const appNix = path.match(/^nix\/packages\/(dotdev|labs|studio)\.nix$/)?.[1]
    if (appNix) {
      addApp(appNix, path)
      continue
    }

    if (
      path === "flake.nix" ||
      path === "flake.lock" ||
      path === "nix/hashes.nix" ||
      path === "nix/overlay.nix" ||
      path === ".github/workflows/ci.yml" ||
      path.startsWith(".github/actions/setup-nix/") ||
      path.startsWith("nix/ci/") ||
      path.startsWith("nix/checks/") ||
      path.startsWith("nix/lib/") ||
      path === "nix/scripts/plan-ci.mjs" ||
      [
        "nix/packages/app.nix",
        "nix/packages/default.nix",
        "nix/packages/images.nix",
        "nix/packages/node-modules.nix",
        "nix/packages/workspace-dist.nix",
      ].includes(path)
    ) {
      addAll(path)
      continue
    }

    const staticOnly =
      path === "README.md" ||
      path.startsWith("docs/") ||
      path.startsWith(".changeset/") ||
      path.startsWith("helm/") ||
      path.startsWith("nix/scripts/") ||
      path === ".github/dependabot.yml" ||
      path.startsWith(".github/workflows/")

    if (!staticOnly) {
      addAll(`unclassified path: ${path}`)
    }
  }

  const apps = appRegistry
    .filter(({ app }) => selected.has(app))
    .map((app) => ({
      ...app,
      reasons: [...(reasons.get(app.app) ?? [])].sort().join(", "),
    }))

  return {
    any: apps.length > 0,
    apps,
    changedPaths: paths,
    helm: paths.some((path) => path.startsWith("helm/")),
    releaseOnly:
      paths.length > 0 &&
      !materialManifestChange &&
      !materialLockChange &&
      paths.every((path) => isGeneratedReleaseChange(path, base, head, internalNames)),
    workspaceTypecheck,
  }
}

const writeGitHubOutputs = (path, result) => {
  const matrix = JSON.stringify({ include: result.apps })
  const reasons = JSON.stringify(
    Object.fromEntries(result.apps.map(({ app, reasons }) => [app, reasons])),
  )
  appendFileSync(
    path,
    [
      `any=${result.any}`,
      `matrix=${matrix}`,
      `release_only=${result.releaseOnly}`,
      `workspace_typecheck=${result.workspaceTypecheck}`,
      `helm=${result.helm}`,
      `reasons=${reasons}`,
      "",
    ].join("\n"),
  )
}

const main = () => {
  const options = parseArguments(process.argv.slice(2))
  const result = plan(options)
  if (options.githubOutput) writeGitHubOutputs(options.githubOutput, result)
  process.stdout.write(`${JSON.stringify(result, undefined, options.json ? 2 : 0)}\n`)
}

main()
