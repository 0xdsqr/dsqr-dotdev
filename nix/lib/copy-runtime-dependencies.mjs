import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, resolve, sep } from "node:path"

const [sourceArgument, destinationArgument, ...rootDependencies] = process.argv.slice(2)

if (!sourceArgument || !destinationArgument) {
  throw new Error(
    "usage: copy-runtime-dependencies.mjs <source-root> <destination-root> [package ...]",
  )
}

const sourceRoot = resolve(sourceArgument)
const destinationRoot = resolve(destinationArgument)
const lock = JSON.parse(readFileSync(resolve(sourceRoot, "package-lock.json"), "utf8"))
const packages = lock.packages

if (!packages || typeof packages !== "object") {
  throw new Error("package-lock.json does not contain a packages map")
}

const dependencyKey = (name, fromKey = "") => {
  let current = fromKey

  while (current) {
    const nestedCandidate = `${current}/node_modules/${name}`
    if (packages[nestedCandidate]) return nestedCandidate

    const parentMarker = current.lastIndexOf("/node_modules/")
    if (parentMarker === -1) break
    current = current.slice(0, parentMarker)
  }

  const rootCandidate = `node_modules/${name}`
  return packages[rootCandidate] ? rootCandidate : undefined
}

const closure = new Set()

const visit = (key) => {
  if (closure.has(key)) return

  const metadata = packages[key]
  if (!metadata) throw new Error(`package-lock.json is missing ${key}`)
  closure.add(key)

  const required = {
    ...metadata.dependencies,
    ...metadata.optionalDependencies,
    ...metadata.peerDependencies,
  }

  for (const name of Object.keys(required).sort()) {
    const resolved = dependencyKey(name, key)
    const optional =
      Object.hasOwn(metadata.optionalDependencies ?? {}, name) ||
      metadata.peerDependenciesMeta?.[name]?.optional === true

    if (!resolved) {
      if (optional) continue
      throw new Error(`cannot resolve runtime dependency ${name} from ${key}`)
    }

    visit(resolved)
  }
}

for (const name of rootDependencies) {
  const key = dependencyKey(name)
  if (!key) throw new Error(`cannot resolve runtime dependency ${name}`)
  visit(key)
}

mkdirSync(resolve(destinationRoot, "node_modules"), { recursive: true })

for (const key of [...closure].sort()) {
  const source = resolve(sourceRoot, key)
  const destination = resolve(destinationRoot, key)
  const sourcePrefix = `${sourceRoot}${sep}`
  const destinationPrefix = `${destinationRoot}${sep}`

  if (!source.startsWith(sourcePrefix) || !destination.startsWith(destinationPrefix)) {
    throw new Error(`refusing to copy package path outside its root: ${key}`)
  }
  if (!existsSync(source)) throw new Error(`installed package is missing: ${key}`)

  mkdirSync(dirname(destination), { recursive: true })
  cpSync(source, destination, {
    dereference: true,
    force: true,
    recursive: true,
  })
}

console.log(
  `copied ${closure.size} runtime package${closure.size === 1 ? "" : "s"}: ${[
    ...closure,
  ].join(", ")}`,
)
