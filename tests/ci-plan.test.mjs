import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"

const planner = process.env.CI_PLAN_SCRIPT ?? join(process.cwd(), "nix/scripts/plan-ci.mjs")
const registry = JSON.parse(
  readFileSync(
    process.env.CI_APP_REGISTRY ?? join(process.cwd(), "nix/ci/apps.json"),
    "utf8",
  ),
)

const writeJson = (root, path, value) => {
  const destination = join(root, path)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, `${JSON.stringify(value, undefined, 2)}\n`)
}

const run = (root, command, ...arguments_) =>
  execFileSync(command, arguments_, { cwd: root, encoding: "utf8" })

const manifest = (name, dependencies = {}) => ({
  name,
  version: "0.0.1",
  private: true,
  dependencies,
})

const createRepository = () => {
  const root = mkdtempSync(join(tmpdir(), "dsqr-ci-plan-"))
  writeJson(root, "nix/ci/apps.json", registry)
  writeJson(root, "package.json", manifest("dsqr-dotdev"))
  writeJson(root, "apps/dotdev/package.json", manifest("dotdev", {
    "@dsqr-dotdev/api": "0.0.1",
    "@dsqr-dotdev/react": "0.0.1",
  }))
  writeJson(root, "apps/labs/package.json", manifest("labs", {
    "@dsqr-dotdev/react": "0.0.1",
  }))
  writeJson(root, "apps/studio/package.json", manifest("studio", {
    "@dsqr-dotdev/api": "0.0.1",
    "@dsqr-dotdev/react": "0.0.1",
  }))
  writeJson(root, "packages/api/package.json", manifest("@dsqr-dotdev/api", {
    "@dsqr-dotdev/database": "0.0.1",
  }))
  writeJson(root, "packages/database/package.json", manifest("@dsqr-dotdev/database", {
    "@dsqr-dotdev/tsconfig": "0.0.1",
  }))
  writeJson(root, "packages/react/package.json", manifest("@dsqr-dotdev/react", {
    "@dsqr-dotdev/api": "0.0.1",
  }))
  writeJson(root, "packages/typescript-config/package.json", manifest("@dsqr-dotdev/tsconfig"))
  writeJson(root, "package-lock.json", {
    name: "dsqr-dotdev",
    version: "0.0.1",
    lockfileVersion: 3,
    packages: {
      "": manifest("dsqr-dotdev"),
      "apps/dotdev": manifest("dotdev", {
        "@dsqr-dotdev/api": "0.0.1",
        "@dsqr-dotdev/react": "0.0.1",
      }),
      "apps/labs": manifest("labs", { "@dsqr-dotdev/react": "0.0.1" }),
      "apps/studio": manifest("studio", {
        "@dsqr-dotdev/api": "0.0.1",
        "@dsqr-dotdev/react": "0.0.1",
      }),
      "packages/api": manifest("@dsqr-dotdev/api", {
        "@dsqr-dotdev/database": "0.0.1",
      }),
      "packages/database": manifest("@dsqr-dotdev/database", {
        "@dsqr-dotdev/tsconfig": "0.0.1",
      }),
      "packages/react": manifest("@dsqr-dotdev/react", {
        "@dsqr-dotdev/api": "0.0.1",
      }),
      "packages/typescript-config": manifest("@dsqr-dotdev/tsconfig"),
      "node_modules/react": { version: "19.2.8" },
    },
  })
  mkdirSync(join(root, "docs"), { recursive: true })
  writeFileSync(join(root, "docs/readme.md"), "baseline\n")
  mkdirSync(join(root, "helm/dotdev-web"), { recursive: true })
  writeFileSync(
    join(root, "helm/dotdev-web/Chart.yaml"),
    "apiVersion: v2\nname: dotdev-web\nversion: 0.0.1\nappVersion: 0.0.1\n",
  )
  writeFileSync(
    join(root, "helm/dotdev-web/values-prod.yaml"),
    "image:\n  version: 0.0.1\n  digest: sha256:old\nreplicas: 1\n",
  )
  for (const app of ["dotdev", "labs", "studio"]) {
    writeFileSync(join(root, `apps/${app}/source.ts`), "export {}\n")
  }
  for (const package_ of ["api", "database", "react", "typescript-config"]) {
    writeFileSync(join(root, `packages/${package_}/source.ts`), "export {}\n")
  }

  run(root, "git", "init", "--initial-branch=master")
  run(root, "git", "config", "user.email", "ci-plan@example.invalid")
  run(root, "git", "config", "user.name", "CI Planner")
  run(root, "git", "config", "commit.gpgsign", "false")
  run(root, "git", "add", ".")
  run(root, "git", "commit", "-m", "baseline")
  return root
}

const change = (root, path, contents) => {
  const destination = join(root, path)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, contents)
  run(root, "git", "add", ".")
  run(root, "git", "commit", "-m", `change ${path}`)
}

const plan = (root) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [planner, "--base", "HEAD^", "--head", "HEAD"],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, CI_REPO_ROOT: root },
      },
    ),
  )

const selectedApps = (result) => result.apps.map(({ app }) => app)

test("selects only the directly changed app", () => {
  const root = createRepository()
  change(root, "apps/dotdev/source.ts", "export const changed = true\n")
  const result = plan(root)
  assert.deepEqual(selectedApps(result), ["dotdev"])
  assert.equal(result.workspaceTypecheck, true)
})

test("fans a shared React package change out through workspace dependencies", () => {
  const root = createRepository()
  change(root, "packages/react/source.ts", "export const changed = true\n")
  const result = plan(root)
  assert.deepEqual(selectedApps(result), ["dotdev", "labs", "studio"])
  assert.equal(result.workspaceTypecheck, true)
})

test("does not build web apps for documentation changes", () => {
  const root = createRepository()
  change(root, "docs/readme.md", "documentation only\n")
  assert.deepEqual(selectedApps(plan(root)), [])
})

test("ignores Changesets version-only release output semantically", () => {
  const root = createRepository()
  const packagePath = join(root, "apps/dotdev/package.json")
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"))
  packageJson.version = "0.0.2"
  writeJson(root, "apps/dotdev/package.json", packageJson)
  const lockPath = join(root, "package-lock.json")
  const lock = JSON.parse(readFileSync(lockPath, "utf8"))
  lock.packages["apps/dotdev"].version = "0.0.2"
  writeJson(root, "package-lock.json", lock)
  writeFileSync(join(root, "apps/dotdev/CHANGELOG.md"), "# 0.0.2\n")
  run(root, "git", "add", ".")
  run(root, "git", "commit", "-m", "version packages")

  const result = plan(root)
  assert.deepEqual(selectedApps(result), [])
  assert.equal(result.releaseOnly, true)
})

test("material external lock changes conservatively rebuild every app", () => {
  const root = createRepository()
  const lockPath = join(root, "package-lock.json")
  const lock = JSON.parse(readFileSync(lockPath, "utf8"))
  lock.packages["node_modules/react"].version = "19.2.9"
  writeJson(root, "package-lock.json", lock)
  run(root, "git", "add", ".")
  run(root, "git", "commit", "-m", "update dependency")

  const result = plan(root)
  assert.deepEqual(selectedApps(result), ["dotdev", "labs", "studio"])
  assert.equal(result.releaseOnly, false)
  assert.equal(result.workspaceTypecheck, true)
})

test("shared Nix builders rebuild every app", () => {
  const root = createRepository()
  change(root, "nix/packages/app.nix", "{ changed = true; }\n")
  assert.deepEqual(selectedApps(plan(root)), ["dotdev", "labs", "studio"])
})

test("does not misclassify arbitrary Helm edits as release-only", () => {
  for (const [path, contents] of [
    [
      "helm/dotdev-web/Chart.yaml",
      "apiVersion: v2\nname: dotdev-web\nversion: 0.0.1\nappVersion: 0.0.1\ndescription: changed\n",
    ],
    [
      "helm/dotdev-web/values-prod.yaml",
      "image:\n  version: 0.0.1\n  digest: sha256:old\nreplicas: 2\n",
    ],
  ]) {
    const root = createRepository()
    change(root, path, contents)
    assert.equal(plan(root).releaseOnly, false)
  }
})

test("unknown root build inputs fail safe by rebuilding every app", () => {
  const root = createRepository()
  change(root, "tsconfig.shared.json", "{}\n")
  assert.deepEqual(selectedApps(plan(root)), ["dotdev", "labs", "studio"])
})
