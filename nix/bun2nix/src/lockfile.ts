/**
 * bun.lock parser for bun2nix
 *
 * Parses Bun's JSONC lockfile format and extracts package metadata
 * needed to build a Nix dependency cache (FODs per npm tarball).
 *
 * Requires Bun >= 1.3.6 for Bun.JSONC.parse.
 */

import type { getCachePath } from "./wyhash"

// bun.lock package tuple: [resolved, registry?, dependencies?, integrity?]
export type PackageEntry = [string, string?, Record<string, unknown>?, string?]

export interface BunLockfile {
  lockfileVersion: number
  workspaces: Record<string, unknown>
  packages: Record<string, PackageEntry>
}

export interface PackageInfo {
  name: string
  version: string
  integrity: string
  url: string
  cachePath: string
}

/**
 * Strip JSONC features (trailing commas, comments) to produce valid JSON.
 * This is a simple regex-based approach that works for bun.lock files.
 */
const stripJsonc = (content: string): string => {
  // Remove single-line comments
  let result = content.replace(/^\s*\/\/.*$/gm, "")
  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, "$1")
  return result
}

/**
 * Read and parse a bun.lock file (JSON or JSONC format).
 *
 * Uses Bun.JSONC.parse when available (Bun >= 1.3.6), falls back to
 * stripping JSONC features + JSON.parse for older Bun versions.
 */
export const readLockfile = async (path: string): Promise<BunLockfile> => {
  const content = await Bun.file(path).text()
  // biome-ignore lint: Bun.JSONC may not exist on older versions
  if ((Bun as any).JSONC?.parse) {
    // biome-ignore lint: checked above
    return (Bun as any).JSONC.parse(content) as BunLockfile
  }
  return JSON.parse(stripJsonc(content)) as BunLockfile
}

/**
 * Construct the npm registry tarball URL for a package.
 *
 * Scoped packages (e.g. @scope/name) need the scope encoded in the path
 * but the tarball filename uses only the unscoped name.
 */
export const getTarballUrl = (name: string, version: string): string => {
  const encodedName = name.startsWith("@")
    ? `@${encodeURIComponent(name.slice(1))}`
    : encodeURIComponent(name)
  const baseName = name.startsWith("@") ? name.split("/")[1] : name
  return `https://registry.npmjs.org/${encodedName}/-/${baseName}-${version}.tgz`
}

/**
 * Parse a single package entry from the lockfile's packages map.
 *
 * Returns null for:
 * - workspace packages (resolved starts with "workspace:")
 * - entries without an integrity hash (not fetchable as FOD)
 * - entries that can't be parsed as name@version
 */
export const parsePackageEntry = (
  entry: PackageEntry,
  computeCachePath: (pkg: string) => string,
): PackageInfo | null => {
  const resolved = entry[0]
  if (!resolved || resolved.startsWith("workspace:")) return null

  // name@version — last @ separates name from version
  // (scoped packages have @ at index 0, so lastIndexOf must be > 0)
  const lastAtIndex = resolved.lastIndexOf("@")
  if (lastAtIndex <= 0) return null

  const name = resolved.substring(0, lastAtIndex)
  const version = resolved.substring(lastAtIndex + 1)
  const integrity = entry[3] || ""

  if (!integrity) return null

  return {
    name,
    version,
    integrity,
    url: getTarballUrl(name, version),
    cachePath: computeCachePath(`${name}@${version}`),
  }
}

/**
 * Extract all unique, fetchable packages from a lockfile.
 *
 * Deduplicates by name@version and sorts alphabetically.
 */
export const extractPackages = (
  lockfile: BunLockfile,
  computeCachePath: (pkg: string) => string,
): PackageInfo[] => {
  const seen = new Set<string>()

  return Object.values(lockfile.packages || {})
    .map((entry) => parsePackageEntry(entry, computeCachePath))
    .filter((pkg): pkg is PackageInfo => pkg !== null)
    .filter((pkg) => {
      const key = `${pkg.name}@${pkg.version}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
    )
}
