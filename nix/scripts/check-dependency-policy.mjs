import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

const root = process.cwd()
const failures = []
const exactVersion = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const dependencySections = ["dependencies", "devDependencies", "optionalDependencies"]

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const fail = (message) => failures.push(message)

const packageFiles = []
const ignoredDirectories = new Set([
  ".cache",
  ".direnv",
  ".git",
  ".output",
  ".tanstack",
  ".turbo",
  ".vinxi",
  "dist",
  "node_modules",
  "result",
])
const collectPackageFiles = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) collectPackageFiles(path)
    if (entry.isFile() && entry.name === "package.json") packageFiles.push(path)
  }
}

collectPackageFiles(root)

for (const packageFile of packageFiles) {
  const manifest = readJson(packageFile)
  const label = relative(root, packageFile)

  if (!exactVersion.test(manifest.version ?? "")) {
    fail(`${label}: package version must be an exact SemVer value`)
  }

  for (const section of dependencySections) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (!exactVersion.test(specifier)) {
        fail(`${label}: ${section}.${name} must be exact, received ${specifier}`)
      }
    }
  }
}

const rootManifest = readJson(join(root, "package.json"))
if (rootManifest.packageManager !== "npm@11.16.0") {
  fail("package.json: packageManager must pin npm@11.16.0")
}
if (rootManifest.engines?.node !== "24.18.0" || rootManifest.engines?.npm !== "11.16.0") {
  fail("package.json: Node and npm engines must match the pinned Nix toolchain")
}
if (rootManifest.devDependencies?.typescript !== "7.0.2") {
  fail("package.json: the stable native TypeScript compiler must remain pinned to 7.0.2")
}
if (rootManifest.overrides?.typescript !== "$typescript") {
  fail("package.json: every transitive TypeScript compiler must resolve through the root pin")
}
if (rootManifest.devDependencies?.esbuild !== "0.28.1") {
  fail("package.json: the patched esbuild constraint must remain pinned to 0.28.1")
}
if (rootManifest.overrides?.esbuild !== "$esbuild") {
  fail("package.json: every transitive esbuild must resolve through the root pin")
}

const lock = readJson(join(root, "package-lock.json"))
if (lock.lockfileVersion !== 3) fail("package-lock.json: lockfileVersion must be 3")

const allowedDeprecated = new Map([
  ["node_modules/@esbuild-kit/core-utils", "3.3.2"],
  ["node_modules/@esbuild-kit/esm-loader", "2.6.5"],
])

const allowedInstallScripts = new Map([
  ["node_modules/@pulumi/kubernetes", "4.33.0"],
  ["node_modules/esbuild", "0.28.1"],
  ["node_modules/fsevents", "2.3.3"],
  ["node_modules/msgpackr-extract", "3.0.4"],
  ["node_modules/protobufjs", "7.6.5"],
])

for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  if (path.endsWith("node_modules/esbuild") && entry.version !== "0.28.1") {
    fail(`package-lock.json: ${path} resolved unexpected esbuild ${entry.version}`)
  }

  if (entry.resolved !== undefined && entry.link !== true) {
    if (!entry.resolved.startsWith("https://registry.npmjs.org/")) {
      fail(`package-lock.json: ${path} resolved from unapproved source ${entry.resolved}`)
    }
    if (typeof entry.integrity !== "string" || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(entry.integrity)) {
      fail(`package-lock.json: ${path} must have sha512 integrity`)
    }
  }

  if (entry.deprecated !== undefined && allowedDeprecated.get(path) !== entry.version) {
    fail(`package-lock.json: unapproved deprecated package ${path}@${entry.version}`)
  }

  if (entry.hasInstallScript === true && allowedInstallScripts.get(path) !== entry.version) {
    fail(`package-lock.json: unapproved install script ${path}@${entry.version}`)
  }
}

for (const [path, expectedVersion] of allowedDeprecated) {
  if (lock.packages?.[path]?.version !== expectedVersion) {
    fail(`package-lock.json: deprecated-package exception ${path}@${expectedVersion} is stale`)
  }
}

for (const [path, expectedVersion] of allowedInstallScripts) {
  const entry = lock.packages?.[path]
  if (entry?.version !== expectedVersion || entry.hasInstallScript !== true) {
    fail(`package-lock.json: install-script exception ${path}@${expectedVersion} is stale`)
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`Dependency policy passed for ${packageFiles.length} manifests.`)
