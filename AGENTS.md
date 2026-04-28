# dsqr-dotdev Agent Guidance

This repo is npm-workspace based, Effect-oriented, and Nix-wrapped. npm owns the TypeScript workspace and package scripts; Nix owns reproducible shells, offline dependency closures, checks, packages, and deployment artifacts.

## Project Direction

- Prefer npm workspaces for day-to-day JavaScript/TypeScript workflows.
- Do not introduce another JavaScript package manager without a strong reason.
- Use Nix for reproducible shells, checks, app packages, and container images. Keep Nix boring, explicit, and close to the npm script graph.
- Shared repo infrastructure belongs under `packages/*`, not `tooling/*`.
- Keep app routers thin. Business logic should move into package services over time.

## Effect Practices

- Use Effect at service boundaries first: database, auth, email, storage, and long-running workflows.
- Model dependencies with `Context.Tag` and provide implementations with `Layer`.
- Compose application runtimes from singleton layers where resources should be initialized once per process.
- Use request/scoped layers only for resources that must be acquired and released per request.
- Prefer typed errors with `Data.TaggedError` for expected failures.
- Use defects/dies only for impossible states or misconfiguration.
- Put `Effect.runPromise` and runtime construction at the edge: tRPC handlers, route handlers, CLIs, scripts.
- Do not wrap every pure helper in Effect. Pure functions should stay pure.
- Add `Effect.withSpan` around meaningful operations such as API procedures, S3 calls, email sends, auth flows, and database workflows.
- Use Effect metrics for aggregate signals, not individual request logs.

## Logging And Observability

- Observability is intentionally deferred until the homelab target is ready. Do not reintroduce vendor SDKs or metrics endpoints casually.
- Keep production logs structured JSON. Human-readable logs are fine in development.
- Redact secrets, auth tokens, raw email contents, and full request bodies.
- When observability returns, put vendor-specific wiring behind a package/service boundary and report from API code through shared helpers or Effect layers.
- Use separate tools for separate jobs: exception tracking for failures, metrics for aggregate signals, and logs for events.
- Keep metric labels low-cardinality and protect scrape endpoints when exposed outside a private network.

## Nix Practices

- Keep `flake.nix` small and delegate details into `nix/*` modules.
- Use Nix packages/checks as wrappers around the repo's npm scripts rather than inventing separate build logic.
- If a Nix build depends on workspace packages, make the workspace symlinks explicit in the derivation.
- Remember that `nix build .#...` sees the Git-tracked flake source. New untracked files may require `path:$PWD#...` for local validation or staging before normal flake builds see them.
- Fixed-output dependency derivations should only include dependency manifests and lockfiles.
- If the dependency hash changes, update `nix/hashes.nix` intentionally after verifying the changed lockfile.
- Prefer singleton process resources in app packages: one runtime and one shared client pool unless a dependency requires request scoping.

## TypeScript And Packages

- Keep shared TypeScript config in `packages/typescript-config` as `@dsqr-dotdev/tsconfig`.
- Keep TanStack Start compatibility shims in `packages/tanstack-start`.
- Package-local `tsconfig.json` files should be small and extend shared config when possible.
- Use `tsgo` from `@typescript/native-preview` for fast typechecking.
- Keep `typescript` available for declaration emit and ecosystem tooling that still relies on the JavaScript compiler API.
- Do not reintroduce a top-level `tooling/*` workspace unless there is a strong reason.

## Source Inspirations

- `/Users/dsqr/workspace/code/executor`: Effect service boundaries, `Context.Tag`, `Layer`, typed errors, runtime-at-edge style.
- `/Users/dsqr/workspace/code/create-epoch-app`: package-scoped cross-cutting infrastructure and observability patterns for the later homelab pass.
- This repo: npm workspaces with Nix packaging/checks and TanStack/tRPC app boundaries.
