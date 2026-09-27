# Project context

A from-scratch dsqr-dotdev rebuild on `refactor/playground` in this checkout.
`master` is a reference, not an architecture to restore wholesale.

## Scope standards

- Keep the starter minimal. Implement only the current request; record future
  standards here without building that infrastructure ahead of time.
- Current scope: hello-world Dotdev, Labs, and Studio apps, shared React/StyleX
  and API packages, one public tRPC endpoint per app, and Nix app/Linux image builds. No database, auth, Helm files,
  deployment workflows, publishing, or cache hosting yet.
- Keep guidance in this file. Do not create `docs/` or speculative packages.
- Work in this checkout; no worktrees unless requested. Leave unrelated changes
  alone. The deferred deployment setup is saved on `codex/deployment-baseline`.
- Keep Dotdev on port 3030, Labs on 3031, and Studio on 3032. Keep hot updates
  working for app components, shared components, and StyleX tokens.

## Nix standards

- Nix owns the toolchain, builds, and checks. Keep `flake.lock` committed; update
  pins intentionally. Pinning enables repeatability, not automatic security fixes.
- Compose with flake-parts. Keep inputs, supported systems, and module imports in
  `flake.nix`; system outputs belong in each module's `perSystem`.
- Keep tools/formatter in `nix/devshell.nix`, checks in `nix/checks.nix`, package
  registration in `nix/packages/default.nix`, and ordinary callPackage derivations
  in `nix/packages/app.nix` and `nix/packages/image.nix`, parameterized by app name.
  All three apps share these builders. Avoid per-app copies or speculative helpers.
- Keep dependency fetching separate from application builds internally. Define
  the manifest-only npm cache inside `app.nix`; it does not need its own file
  or public package output. Component edits must not invalidate its derivation.
- Pin direct npm dependencies exactly and commit `package-lock.json`. Update the
  dependency hash in `nix/packages/app.nix` when the cache changes.
  Nix and npm lockfiles are complementary, not replacements for one another.
- Install from the fixed-output npm cache offline during builds. Dependency
  lifecycle scripts are disabled; review any dependency requiring them explicitly.
- Select source inputs in `nix/packages/app.nix`. Exclude secrets, node_modules,
  generated output, and unrelated files. Add asset types/workspaces deliberately.
- Require sandboxing for reproducibility verification; do not silently fall back.
  `--offline` is not a network sandbox. A cold machine must first fetch or receive
  the complete build closure and flake inputs; keep these rooted against GC.
- Force repeat builds with `--rebuild` and compare outputs. A warm cache hit alone
  does not demonstrate reproducibility. Exclude timestamps and local build paths
  from outputs; Nitro's timestamped metadata is not needed by the runtime.
- Keep checks independent of secrets, external services, and local node_modules.
  Report actual builds/tests separately from cross-platform evaluation.
- Cache support should use ordinary Nix outputs and signed substitutes. Configure
  Cachix or a self-hosted cache only when requested, using real URLs/public keys.
  Never put cache write/signing credentials in source or derivations.

## Directory and dependency standards

```text
apps/
  dotdev/              Public website; development port 3030
  labs/                Labs placeholder; development port 3031
  studio/              Studio placeholder; development port 3032
packages/
  api/                 Shared server procedures, API client factory, and types
  react/               Shared components, StyleX theme, fonts, and reset
nix/
  packages/            Application and image derivations
  checks/              Runtime/build checks
tsconfig.base.json     Shared strict TypeScript settings
```

- `apps/*` are deployable applications; `packages/*` are reusable source packages.
  Use direct names (`api`, `react`, later `database`), not a generic `core/` layer.
- Apps may import shared packages. Packages must not import apps or create cyclic
  dependencies. React components remain independent of API/database runtime code.
- Consumers use package exports, never reach into another package's `src/`.
  Browser-safe types and server runtime code have separate exports. Name server
  implementation files `*.server.ts` so Start's import protection can reject leaks.
- Every workspace has a `tsconfig.json` extending the root base and a `typecheck`
  script covering its entire source. The root command checks all workspaces, not
  just files reached through app imports. TypeScript is pinned once at the root;
  packages declare their own dependencies and required ambient type packages.
- Shared packages compile with their consuming app; a type-check config does not
  imply a separate emitted library build. Keep browser and Node ambient types local
  to the workspaces that need them.
- Add `packages/database` with the first persisted feature, owning its schema,
  connection factory, and migrations. API code may depend on it; it must not depend
  on API or React. Add folders/modules only when real code needs them.

## Container standards

- Build images with Nix `dockerTools.buildLayeredImage`; no Dockerfile or base
  image pull. The image uses the same tested app package and pinned runtime.
- Ship runtime files and the slim Node runtime, not npm or the development shell.
  Include CA certificates. Start Node directly as PID 1 and run as UID/GID 10001.
- Listen on `0.0.0.0:3000` in production. Keep the image compatible with read-only
  execution and dropped Linux capabilities. Inject secrets only at runtime.
- Use deterministic layer timestamps and content-derived tags, not `latest`.
  A Nix output tag is not the OCI registry digest.
- Linux images require a matching native or remote Linux builder. macOS output
  cannot run in a Linux container. Supported Linux targets are x86_64 and aarch64.
- Building is in scope; pushing images, deploying, or setting up a cluster is not.

## Helm standards

These are future requirements, not authorization to add a chart now.

- Deploy immutable registry digests; require an explicit repository and digest.
- Use non-root execution, read-only root filesystems, dropped capabilities,
  `allowPrivilegeEscalation: false`, and `RuntimeDefault` seccomp.
- Disable automatic service-account tokens unless the application needs the API.
- Provide startup/readiness/liveness probes and explicit resource requests/limits.
- Keep secrets outside charts/images. Choose ingress, TLS, and network policy for
  the actual cluster. Validate rendering/security through Nix when Helm is added.

## React and styling standards

- React + TanStack Start/Router, TypeScript, Vite, and StyleX in each app.
  Nitro produces standalone Node servers. Keep one hello-world page per app for now.
- Use the stable Go-native TypeScript compiler (currently pinned to `7.0.2`).
  TypeScript 7 runs through `tsc`; a separate native-preview package is unnecessary.
  Update stable versions deliberately with the lockfile and Nix dependency hash.
- Shared components, theme tokens, fonts, and the reset live in `packages/react`
  (`@dsqr-dotdev/react`). Apps compose them; do not duplicate shared styling.
- Preserve the purple palette and Geist typography. Evolve centralized StyleX
  tokens as design decisions are made. Light/dark currently follows the system.
- No Tailwind or old UI stack without an explicit decision. Add only consumed
  components. Compile shared source through the app; type-check every workspace.
- `routeTree.gen.ts` is generated and ignored. Build before standalone typechecking
  in a fresh checkout. Keep environment secrets in ignored local files.

## API standards

- Shared API code lives in `packages/api`; add `packages/database` when a feature
  needs persistence. Do not add a `core/` layer, empty packages, or domain scaffolds.
- Compile shared API source inside each consuming app's Nix build, like the React
  package. The app owns the HTTP handler; a separate API service is not needed yet.
- Use tRPC's Fetch adapter and `@trpc/tanstack-react-query`. Browser code imports
  only the API router type; runtime server exports live under `@dsqr-dotdev/api/server`. All apps share the
  client factory exported by `@dsqr-dotdev/api/client` and mount their own handler.
- Create QueryClient and tRPC clients per router instance, never as server globals.
  The initial health query runs in the browser after hydration; add SSR prefetch
  and cache hydration together when a feature needs server-fetched query data.
- The current `health` query is public and confirms API connectivity only. Add
  request validation and server-side authorization with the first real inputs and
  protected feature; UI login checks alone must never authorize an endpoint.
- Mount only the procedures each app needs. Add bounded input schemas, explicit
  response fields, pagination, and consistent errors as domain endpoints arrive.
  Authentication must be followed by role/ownership checks for each operation.
- Keep same-origin browser transport by default. Before adding cookie-authenticated
  mutations, implement and test CSRF/origin protection at the tRPC HTTP boundary;
  Start's server-function protection does not automatically cover custom routes.
  Add request limits and appropriate rate limiting with exposed write operations.
- Add database schema, migrations, and Better Auth only as the corresponding
  features arrive. Keep builds independent of database connections and secrets.

## Working commands

```sh
nix develop --command npm ci
nix run .#dev                            # Dotdev: http://127.0.0.1:3030
nix run .#dev-labs                       # Labs: http://127.0.0.1:3031
nix run .#dev-studio                     # Studio: http://127.0.0.1:3032
nix build .#dotdev .#labs .#studio        # Production apps
nix run .                               # Production server, port 3000
nix build .#dotdev-image .#labs-image .#studio-image # Linux builder
nix fmt flake.nix nix/*.nix nix/checks/*.nix nix/packages/*.nix
nix flake check --no-update-lock-file --option sandbox true --option sandbox-fallback false
nix flake check --all-systems --no-build --no-update-lock-file
# After building/priming inputs, force an offline repeat and compare:
nix build .#dotdev .#labs .#studio --rebuild --offline --option substitute false --option sandbox true --option sandbox-fallback false --no-link --no-update-lock-file
```

Stage new files explicitly before Git-backed flake commands; avoid `git add .`.
The `smoke` check verifies toolchain execution. Each app check builds/type-checks
that app and both shared packages, then checks HTML, public tRPC requests/batching,
assets, shared styles/fonts, and unknown routes/procedures. Each app build includes
only its own source plus shared source and all workspace manifests. Root
`npm run build` builds all apps; `npm run typecheck` checks every workspace.

## Research references

Reviewed in September 2026; use primary documentation and the pinned Nixpkgs
implementation when making changes, not popularity alone.

- [Nixpkgs dockerTools](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-dockerTools)
- [OpenCode dependency isolation](https://github.com/anomalyco/opencode/blob/dev/nix/node_modules.nix)
- [Zed flake-parts setup](https://github.com/zed-industries/zed/blob/main/flake.nix)
- [Kubernetes Restricted policy](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Cachix signed caches](https://docs.cachix.org/getting-started)
- [tRPC TanStack Query integration](https://trpc.io/docs/client/tanstack-react-query/setup)
- [tRPC Fetch adapter](https://trpc.io/docs/server/adapters/fetch)
- [TanStack Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
