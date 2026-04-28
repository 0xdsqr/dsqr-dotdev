import { build } from "esbuild"
import { readdir, rm } from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

async function collectEntrypoints(dir) {
  const entries = []

  async function walk(currentDir) {
    for (const entry of await readdir(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        entries.push(fullPath)
      }
    }
  }

  await walk(dir)
  return entries.sort()
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))
    })
  })
}

const rootDir = process.cwd()
const srcDir = path.join(rootDir, "src")
const distDir = path.join(rootDir, "dist")
const esmOutDir = path.join(distDir, "esm")
const typesOutDir = path.join(distDir, "types")
const startTime = Date.now()
const tscBin = fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url))

await rm(distDir, { recursive: true, force: true })

const entryPoints = await collectEntrypoints(srcDir)

if (entryPoints.length === 0) {
  console.error("No TypeScript entrypoints found under src/")
  process.exit(1)
}

try {
  await build({
    entryPoints,
    outdir: esmOutDir,
    outbase: srcDir,
    format: "esm",
    platform: "node",
    target: "esnext",
    bundle: false,
    packages: "external",
    logLevel: "info",
  })

  await run(
    process.execPath,
    [
      tscBin,
      "--project",
      "tsconfig.json",
      "--outDir",
      typesOutDir,
      "--declaration",
      "--emitDeclarationOnly",
      "--declarationMap",
      "--noEmit",
      "false",
    ],
    { cwd: rootDir },
  )

  console.log(`✓ Build completed in ${Date.now() - startTime}ms`)
  console.log(`  Entrypoints: ${entryPoints.length}`)
} catch (error) {
  console.error(`✗ Build failed after ${Date.now() - startTime}ms`)
  console.error(error)
  process.exit(1)
}
