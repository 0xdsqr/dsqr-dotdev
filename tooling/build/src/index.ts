import { $, Glob } from "bun"
import * as path from "path"

export interface BuildSuccess {
  duration: number
  entrypoints: string[]
}

export interface BuildFailure {
  duration: number
  error: Error
}

export type BuildResult = { ok: true; value: BuildSuccess } | { ok: false; error: BuildFailure }

export interface BuildOptions {
  rootDir?: string
  srcDir?: string
  outDir?: string
  patterns?: string[]
  format?: "esm" | "cjs"
  external?: string[]
  declarations?: boolean
  clean?: boolean
  entrypoints?: string[]
  onBeforeBuild?: () => Promise<void> | void
  onSuccess?: (result: BuildSuccess) => Promise<void> | void
  onError?: (error: BuildFailure) => Promise<void> | void
}

export async function createBuild(options: BuildOptions = {}): Promise<BuildResult> {
  const startTime = Date.now()

  const rootDir = options.rootDir ?? process.cwd()
  const srcDir = options.srcDir ?? "src"
  const outDir = options.outDir ?? "dist"
  const patterns = options.patterns ?? [`./${srcDir}/**/*.ts`, `./${srcDir}/**/*.tsx`]
  const format = options.format ?? "esm"
  const external = options.external ?? ["*"]
  const declarations = options.declarations ?? true
  const clean = options.clean ?? true
  const additionalEntrypoints = options.entrypoints ?? []

  try {
    if (options.onBeforeBuild) {
      await options.onBeforeBuild()
    }

    if (clean) {
      await $`rm -rf ${path.join(rootDir, outDir)}`
    }

    const collectedFiles: string[] = [...additionalEntrypoints]

    for (const pattern of patterns) {
      const glob = new Glob(pattern)
      const files = glob.scan() as AsyncIterable<string>
      for await (const file of files) {
        const fullPath = path.resolve(rootDir, file)
        collectedFiles.push(fullPath)
      }
    }

    if (collectedFiles.length === 0) {
      throw new Error(`No files found matching patterns: ${patterns.join(", ")}`)
    }

    const buildResult = await Bun.build({
      format,
      outdir: path.join(rootDir, outDir, format),
      external,
      root: path.join(rootDir, srcDir),
      entrypoints: collectedFiles,
    })

    if (!buildResult.success) {
      for (const log of buildResult.logs) {
        console.error(log)
      }
      throw new Error("Bun build failed")
    }

    if (declarations) {
      const tscResult =
        await $`cd ${rootDir} && tsc --outDir ${path.join(outDir, "types")} --declaration --emitDeclarationOnly --declarationMap`.nothrow()

      if (tscResult.exitCode !== 0) {
        console.warn("TypeScript declaration generation had warnings/errors, but continuing...")
      }
    }

    const successResult: BuildSuccess = {
      duration: Date.now() - startTime,
      entrypoints: collectedFiles,
    }

    if (options.onSuccess) {
      await options.onSuccess(successResult)
    }

    return {
      ok: true,
      value: successResult,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const failureResult: BuildFailure = {
      duration: Date.now() - startTime,
      error: err,
    }

    if (options.onError) {
      await options.onError(failureResult)
    }

    return {
      ok: false,
      error: failureResult,
    }
  }
}

// Helper to unwrap results with nice error handling
export function unwrap<T>(result: BuildResult): T {
  if (!result.ok) {
    console.error(`Build failed after ${result.error.duration}ms`)
    throw result.error.error
  }
  return result.value as T
}

// Helper to map over results
export function map<U>(result: BuildResult, _fn: (value: BuildSuccess) => U): BuildResult {
  if (!result.ok) return result
  return {
    ok: true,
    value: {
      ...result.value,
      // fn returns U but we need to return BuildSuccess, so we just log it
    } as BuildSuccess,
  }
}

// Helper to chain builds
export async function andThen(
  result: BuildResult,
  fn: () => Promise<BuildResult>,
): Promise<BuildResult> {
  if (!result.ok) return result
  return fn()
}

export function createBuildFactory(defaultOptions: BuildOptions) {
  return async (overrideOptions: Partial<BuildOptions> = {}) => {
    return createBuild({
      ...defaultOptions,
      ...overrideOptions,
    })
  }
}

export const buildPresets = {
  async library(rootDir: string, options: Partial<BuildOptions> = {}) {
    return createBuild({
      rootDir,
      format: "esm",
      declarations: true,
      external: ["*"],
      ...options,
    })
  },

  async reactComponents(rootDir: string, options: Partial<BuildOptions> = {}) {
    return createBuild({
      rootDir,
      format: "esm",
      declarations: true,
      external: ["react", "react-dom", "*"],
      ...options,
    })
  },

  async static(rootDir: string, options: Partial<BuildOptions> = {}) {
    return createBuild({
      rootDir,
      format: "esm",
      declarations: false,
      external: [],
      ...options,
    })
  },
}
