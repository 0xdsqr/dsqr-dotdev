# dsqr-dotdev Agent Notes

## Repository Direction

- Treat this repository as the canonical home for dsqr.dev apps, deployment assets, Helm charts, and Pulumi-backed homelab infrastructure after the migration.
- Keep the workspace Nix-first. New tools, package builds, checks, image builds, Helm validation, and CI tasks should be expressible through the flake before relying on ad hoc host tools.
- Preserve existing user state. The source `homelab` repo currently has unstaged edits in Helm values and `infra/inventory/proxmox.ts`; do not overwrite or discard those during migration.
- Host NixOS/nix-darwin/home-manager configuration lives outside this repository. Do not re-import `homelab/nixos-config` unless explicitly asked.

## Migration Shape

- The first migration slice has imported these source surfaces into this repo:
  - `packages/haven`
  - `packages/infra-model`
  - `packages/effect-pulumi/*`
  - `infra/*`
  - `helm/*`
- Continue refining the migration in deliberate slices:
  1. Pulumi/Haven TypeScript packages and `infra/*`.
  2. Helm charts and chart publishing workflows.
  3. CI and Nix checks that validate all migrated surfaces.
- Prefer preserving history with `git subtree`, `git filter-repo`, or a temporary worktree import when source history matters.
- After files move, update internal paths, package names, workflow references, chart paths, README links, lockfile/package workspace references, and any `.envrc`/Pulumi project paths.
- Keep deployable artifacts split by concern: app image builds in `nix/packages`, Helm chart checks/publishing in CI, and Pulumi/Haven infrastructure under `infra/*` plus supporting packages.

## Effect Style

- Effect is already a first-class dependency here. New non-UI infrastructure code should prefer `Effect.gen`, typed errors, services, Layers, Config, and scoped resources instead of raw `async`/`await` control flow.
- Raw `async`/`await` is acceptable at external framework boundaries such as TanStack loaders, tRPC handlers, React event handlers, and CLI entrypoints that call `Effect.runPromise`. Keep core domain and infrastructure logic effectful.
- Wrap Promise APIs with `Effect.tryPromise` or `Effect.async`, then expose them behind service interfaces where they are shared or stateful.
- Follow current Effect ecosystem patterns: service tags via `Context.Tag` or `Effect.Service`, live implementations via `Layer.effect`/`Layer.scoped`/`Layer.sync`, and runtime composition through a small shared runtime layer.
- For platform APIs, prefer official Effect packages such as `@effect/platform`, `@effect/platform-node`, `@effect/opentelemetry`, and domain libraries like `effect-aws` where they reduce custom adapters.

## Current Repo Facts

- `dsqr-dotdev` is an npm workspace monorepo with apps in `apps/*` and shared packages in `packages/*`.
- The flake currently supports `aarch64-darwin` and `x86_64-linux`, exposes `formatter`, `checks`, `devShells.default`, app packages, and OCI image packages.
- CI currently runs `nix flake check` and builds app images with Nix. Image publishing pushes `dotdev-web`, `dotdev-studio`, and `dotdev-labs` to GHCR.
- TypeScript checks are routed through npm scripts and Nix checks. The repo uses `oxlint` and `treefmt-nix`.

## Source Repo Facts

- `homelab` contains Helm charts for `dotdev-web`, `dotdev-studio`, and `dotdev-labs`. Tastings with Tay charts now live in the `tastingswithtay` repo and are referenced from GitOps as external app charts.
- `homelab` contains `packages/haven`, `packages/infra-model`, and `packages/effect-pulumi/*` for Pulumi-backed Cloudflare, Hetzner, Kubernetes, Proxmox, and Tailscale infrastructure.
- `homelab` currently uses npm workspaces, Node 24, Effect 3.21, Pulumi packages, Biome formatting, and a flake-parts dev shell.
- `create-epoch-app` is a useful pattern reference for Effect + Convex + observability, but it is Bun/Turbo/Biome/Next-oriented and should not be copied wholesale into this npm/Nix workspace.
