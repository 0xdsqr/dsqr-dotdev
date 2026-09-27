# dsqr.dev

Three minimal React + TanStack Start apps with a shared StyleX design system and
tRPC API foundation. Nix and flake-parts own development tools, builds, and checks.
Architecture and incremental security requirements live in [AGENTS.md](AGENTS.md).

## Develop

Install once with `nix develop --command npm ci`, then run each app in its own terminal:

| App | Command | Preview |
| --- | --- | --- |
| Dotdev | `nix run .#dev` | http://127.0.0.1:3030 |
| Labs | `nix run .#dev-labs` | http://127.0.0.1:3031 |
| Studio | `nix run .#dev-studio` | http://127.0.0.1:3032 |

Each page renders the shared hello-world UI and fetches "API connected." from its
own public `/api/trpc/health` endpoint after hydration. Vite hot updates include
shared components and StyleX tokens. No auth, database, or environment secrets yet.

## Build and check

```sh
nix build .#dotdev .#labs .#studio
nix flake check --option sandbox true --option sandbox-fallback false
nix develop --command npm run typecheck
nix run .#dotdev                         # Production server, port 3000
nix build .#dotdev-image .#labs-image .#studio-image # Matching Linux builder
```

All app builds use one hash-verified npm cache and a shared Nix builder. Each app
compiles its own source and the shared packages into standalone runtime output.
The HTTP checks exercise each packaged server: rendered HTML, public API requests
and batching, styles/fonts, and missing routes/procedures. Images use Nix
`dockerTools` and a non-root runtime; no Dockerfile is needed.

## Layout

- `apps/dotdev`, `apps/labs`, `apps/studio`: app routes, HTTP adapters, and configuration.
- `packages/api`: shared tRPC router, browser client factory, and type exports.
- `packages/react`: shared hello-world layout, components, StyleX theme, fonts, and reset.
- `tsconfig.base.json`: common strict settings; every workspace has its own config
  and type-check command covering all its source.
- `nix/packages/app.nix`, `image.nix`: shared application and image builders.
- `nix/checks/app.nix`: shared HTTP checks; `nix/devshell.nix`: development tools.

Change `packages/react/src/styles/theme.stylex.ts` to evolve the shared purple
palette and Geist typography. Light/dark colors follow the system preference.
Generated routes, dependencies, and build output are ignored. Run a build before
standalone type-checking in a fresh checkout to generate each app's route types.
