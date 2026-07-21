import { access, readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const errors = []

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"))

const packageDirectories = async () => {
  const directories = []

  for (const parent of ["apps", "packages", "packages/effect-pulumi"]) {
    for (const entry of await readdir(path.join(root, parent), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const relativePath = path.join(parent, entry.name)
      try {
        await access(path.join(root, relativePath, "package.json"))
        directories.push(relativePath)
      } catch {
        // Some package grouping directories intentionally have no manifest.
      }
    }
  }

  return [...new Set(directories)].sort()
}

const rootPackage = await readJson("package.json")
if (!semverPattern.test(rootPackage.version)) {
  errors.push(`root package version is not SemVer: ${rootPackage.version}`)
}
if (!semverPattern.test(rootPackage.devDependencies?.["@changesets/cli"] ?? "")) {
  errors.push("@changesets/cli must be pinned to an exact SemVer version")
}

const manifests = new Map()
for (const directory of await packageDirectories()) {
  const manifest = await readJson(path.join(directory, "package.json"))
  if (!manifest.name) errors.push(`${directory}/package.json has no package name`)
  if (!semverPattern.test(manifest.version ?? "")) {
    errors.push(`${manifest.name ?? directory} version is not SemVer: ${manifest.version}`)
  }
  if (manifest.private !== true) {
    errors.push(`${manifest.name ?? directory} must remain private`)
  }
  if (manifests.has(manifest.name)) {
    errors.push(`duplicate workspace package name: ${manifest.name}`)
  }
  manifests.set(manifest.name, { directory, manifest })
}

for (const { directory, manifest } of manifests.values()) {
  for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const [dependency, declaredVersion] of Object.entries(manifest[section] ?? {})) {
      const internal = manifests.get(dependency)
      if (internal && declaredVersion !== internal.manifest.version) {
        errors.push(
          `${manifest.name} ${section}.${dependency} is ${declaredVersion}; expected ${internal.manifest.version}`,
        )
      }
    }
  }

  const changelogPath = path.join(directory, "CHANGELOG.md")
  try {
    const changelog = await readFile(path.join(root, changelogPath), "utf8")
    if (!changelog.includes(`## ${manifest.version}`)) {
      errors.push(`${changelogPath} has no entry for ${manifest.version}`)
    }
  } catch {
    errors.push(`${manifest.name} is missing ${changelogPath}`)
  }
}

const releaseByApp = new Map([
  ["dotdev", { chart: "helm/dotdev-web/Chart.yaml", deployment: "dotdev-web" }],
  ["studio", { chart: "helm/dotdev-studio/Chart.yaml", deployment: "dotdev-studio" }],
  ["labs", { chart: "helm/dotdev-labs/Chart.yaml", deployment: "dotdev-labs" }],
])

for (const [app, { chart: chartPath, deployment }] of releaseByApp) {
  const chart = await readFile(path.join(root, chartPath), "utf8")
  const chartVersion = chart.match(/^version:\s*["']?([^\s"']+)/m)?.[1]
  const appVersion = chart.match(/^appVersion:\s*["']?([^\s"']+)/m)?.[1]
  const packageVersion = manifests.get(app)?.manifest.version

  if (!semverPattern.test(chartVersion ?? "")) {
    errors.push(`${chartPath} version is not SemVer: ${chartVersion}`)
  }
  if (chartVersion !== packageVersion) {
    errors.push(`${chartPath} version is ${chartVersion}; expected ${packageVersion}`)
  }
  if (appVersion !== packageVersion) {
    errors.push(`${chartPath} appVersion is ${appVersion}; expected ${packageVersion}`)
  }

  const productionValuesPath = `helm/${deployment}/values-prod.yaml`
  const productionValues = await readFile(path.join(root, productionValuesPath), "utf8")
  if (!/^\s*requireDigest:\s*true\s*$/m.test(productionValues)) {
    errors.push(`${productionValuesPath} must require an immutable image digest`)
  }
  if (!/^\s*digest:\s*["']{2}\s*$/m.test(productionValues)) {
    errors.push(`${productionValuesPath} must not contain a cluster-specific digest`)
  }

  const clusterValuesPath = `gitops/values/${deployment}/hub-a.yaml`
  const clusterValues = await readFile(path.join(root, clusterValuesPath), "utf8")
  const promotedVersion = clusterValues.match(/^\s*version:\s*["']?([^\s"']+)/m)?.[1]
  const promotedDigest = clusterValues.match(/^\s*digest:\s*["']?(sha256:[0-9a-f]{64})/m)?.[1]
  if (promotedVersion !== packageVersion) {
    errors.push(`${clusterValuesPath} image.version is ${promotedVersion}; expected ${packageVersion}`)
  }
  if (!promotedDigest) {
    errors.push(`${clusterValuesPath} must pin a lowercase sha256 image digest`)
  }
}

const changesetConfig = await readJson(".changeset/config.json")
if (changesetConfig.baseBranch !== "master") errors.push("Changesets baseBranch must be master")
if (changesetConfig.privatePackages?.version !== true) {
  errors.push("Changesets must version private packages")
}
if (changesetConfig.privatePackages?.tag !== false) {
  errors.push("Changesets must not tag private packages")
}
if (changesetConfig.access !== "restricted") {
  errors.push("Changesets access must remain restricted")
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"))
  process.exitCode = 1
} else {
  console.log(`release versions valid for ${manifests.size} private workspaces`)
}
