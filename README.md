# dsqr.dev

Three minimal React + TanStack Start apps with a shared StyleX design system and
Effect HttpApi foundation. Nix and flake-parts own development tools, builds, and checks.
Architecture and incremental security requirements live in [AGENTS.md](AGENTS.md).

## Develop

Install once with `nix develop --command npm ci`, then run each app in its own terminal:

| App | Command | Preview |
| --- | --- | --- |
| Dotdev | `nix run .#dev` | http://127.0.0.1:3030 |
| Labs | `nix run .#dev-labs` | http://127.0.0.1:3031 |
| Studio | `nix run .#dev-studio` | http://127.0.0.1:3032 |

Dotdev renders the intro and Labs the DSQR Labs page; Studio renders the shared
hello-world UI and fetches "API connected." from its public `/api/health`. Vite hot updates include
shared components and StyleX tokens. No auth yet. Dotdev's newsletter signup stores addresses in the local database;
set `DSQR_DATABASE=remote` to use `DATABASE_URL` instead.

## Local database

From the repository root, after `npm ci`:

```sh
nix run .#db-start
nix develop --command npm run db:push
nix develop --command npm run db:studio
# Ctrl-C stops Studio; stop PostgreSQL separately:
nix run .#db-stop
```

PostgreSQL 18 uses an owner-only Unix socket under `.local/postgres/socket`, port
55432, user `dsqr_dev`, database `dsqr_dotdev_dev`. There is no TCP listener.
Startup creates an empty database; only the explicit push applies the `app` schema.
Stop preserves data. All Drizzle commands ignore `DATABASE_URL` and use this local
instance. Studio binds to loopback and prints its browser URL.

`app.subscriptions` records one normalized email with pending/subscribed/unsubscribed
status and timestamps. Signup, confirmation, unsubscribe, and Resend integration
are not wired yet. The database package does not connect during application builds.

While designing, use `db:push`. When ready for the first migration:

```sh
nix develop --command npm run db:generate -- --name=initial
nix develop --command npm run db:migrate
```

Generate writes files in `packages/database/migrations`; migrate is for a **fresh**
local database, not the one already initialized by push. Generate itself does not
apply SQL. Review and commit the initial migration when the design settles. No
baseline migration or legacy-data import is committed yet; Knox remains untouched.

The disposable check generates/migrates its own fresh database and verifies
constraints, repeated application, and preservation of legacy `public` tables:

```sh
nix build .#checks.aarch64-darwin.database --no-link --option sandbox true --option sandbox-fallback false
```

Use your Nix system name on Linux. The check never uses `.local` in your checkout.

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
- `packages/database`: local subscription schema, connection factory, Drizzle commands.
- `packages/api`: Effect HttpApi contracts, services, handlers, and atom clients.
- `packages/react`: shared hello-world layout, components, StyleX theme, fonts, and reset.
- `tsconfig.base.json`: common strict settings; every workspace has its own config
  and type-check command covering all its source.
- `nix/packages/app.nix`, `image.nix`: shared application and image builders.
- `nix/checks/app.nix`: shared HTTP checks; `nix/devshell.nix`: development tools.

Change `packages/react/src/styles/theme.stylex.ts` to evolve the shared tokens
(warm neutrals, purple accent, Geist type, space, radius, motion). Light/dark colors follow the system preference.
Generated routes, dependencies, and build output are ignored. Run a build before
standalone type-checking in a fresh checkout to generate each app's route types.
