# dsqr-dotdev

The source for [dsqr.dev](https://dsqr.dev), plus the DSQR Labs and Studio sites. Each is a
React app (TanStack Start, StyleX, Effect) served by a small Node server.

## Run it

You need [Nix](https://determinate.systems/nix-installer/) with flakes enabled. Nothing else:
Nix provides Node, npm, PostgreSQL and every tool below at pinned versions.

```sh
git clone https://github.com/0xdsqr/dsqr-dotdev
cd dsqr-dotdev
nix run .#dev
```

Open <http://127.0.0.1:3030>. The first run installs npm dependencies, and later runs reinstall
only when `package-lock.json` changes. Edits to components and styles hot-reload.

| Site     | Command                | Address                 |
| -------- | ---------------------- | ----------------------- |
| dsqr.dev | `nix run .#dev`        | <http://127.0.0.1:3030> |
| Labs     | `nix run .#dev-labs`   | <http://127.0.0.1:3031> |
| Studio   | `nix run .#dev-studio` | <http://127.0.0.1:3032> |

### Newsletter signup (optional)

The site runs without a database; only the subscribe form needs one. To try it locally:

```sh
nix run .#db-start              # private PostgreSQL 18 on a Unix socket, data in .local/
nix develop --command npm run db:push
nix run .#dev
nix run .#db-stop               # when you're done; your data is kept
```

### Without Nix

Install Node 26 (npm 11.20 or newer), then:

```sh
npm ci
npm run dev
```

## Build and check

```sh
nix run .                 # production dsqr.dev server on port 3000
nix build .#dotdev        # production build only (also .#labs, .#studio)
nix flake check           # everything CI runs: builds, smoke tests, unit tests, lint,
                          # formatting, database migrations, Helm and workflow checks
nix fmt                   # format Nix, TypeScript, CSS, JSON, Markdown and YAML
```

Inside `nix develop` you also get the npm scripts:

```sh
npm run typecheck         # every workspace
npm test                  # API tests (@effect/vitest)
oxlint apps packages      # lint
```

## Updating dependencies

Every npm dependency is pinned exactly (`.npmrc` sets `save-exact`). After changing one:

```sh
nix develop --command npm install <package>@<version>
nix run .#update-npm-hash   # refresh the Nix hash of the npm dependency cache
nix flake check
```

Nix inputs update weekly through an automated `flake.lock` pull request; run
`nix flake update` to update them by hand.

## Layout

```text
apps/dotdev     dsqr.dev: the 3D theater home, about page, newsletter signup
apps/labs       DSQR Labs LLC page
apps/studio     Studio placeholder
packages/react  Shared components, StyleX theme, app shell, security headers
packages/api    Effect HttpApi: contracts, handlers, rate limiting, probes
packages/database  Drizzle schema, connection layer, migrations
nix/            Builds, dev apps, checks, formatting, CI tooling
helm/dsqr-app   Kubernetes chart shared by all three apps
```

`AGENTS.md` records the project's standards and the reasoning behind them.
