# Project context

A from-scratch dsqr-dotdev rebuild on `refactor/playground` in this checkout.
`master` is a reference, not an architecture to restore wholesale.

## Scope standards

- Keep the starter minimal. Implement only the current request; record future
  standards here without building that infrastructure ahead of time.
- Current scope: the Dotdev intro and Labs pages, a hello-world Studio app, shared React/StyleX
  and API packages, one public tRPC endpoint per app, Nix app/Linux image builds,
  and a local PostgreSQL/Drizzle subscription schema. No live subscription flow, auth, Helm files,
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
  database/            Drizzle schema, server connection factory, local CLI config
  react/               Shared components, StyleX theme, fonts, and reset
nix/
  packages/            Application and image derivations
  checks/              Runtime/build checks
tsconfig.base.json     Shared strict TypeScript settings
```

- `apps/*` are deployable applications; `packages/*` are reusable source packages.
  Use direct names (`api`, `react`, `database`), not a generic `core/` layer.
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
- `packages/database` owns its schema, connection factory, and eventual migrations.
  API code may depend on it; it must not depend
  on API or React. Add folders/modules only when real code needs them.

## Database standards

- PostgreSQL 18 matches Knox. Local tooling lives in `nix/database.nix`; run
  `nix run .#db-start` / `.#db-stop` from the repository root. Data is ignored
  under `.local/postgres`, outside the Nix store. Stop preserves the data.
- Development PostgreSQL listens only on a private Unix socket, with trust auth
  gated by owner-only directory permissions. No TCP listener or production secrets.
- `packages/database` owns schema and the server-only connection factory. It has
  its own TypeScript config; no emitted library build or eager connection on import.
  API code owns subscription behavior and email delivery; React never imports DB code.
- `app.subscriptions` is independent of accounts: UUID, unique normalized email,
  pending/subscribed/unsubscribed status, and timezone-aware timestamps. Validate
  email syntax in the future API; the DB enforces nonempty lowercase/trimmed values,
  uniqueness, allowed statuses, and a timestamp for unsubscribed records.
  Drizzle updates `updated_at`; raw SQL must update it explicitly.
- Repeated signup must not reactivate unsubscribed people without new confirmation.
  Preserve opt-outs during import; do not invent confirmation dates. Confirmation
  tokens, Resend contact sync/webhooks, unsubscribe routes, and sending arrive with
  the subscription flow; the schema alone does not implement these behaviors.
- Existing `public` tables stay intact. Create only `app` now; `auth` arrives with
  sign-in. Scope Drizzle push to `app`, never implicitly manage every schema.
- All current DB scripts use the local socket, ignoring DATABASE_URL. Do not
  repoint this config at Knox. Remote migration configuration/access is separate work.
  Starting PostgreSQL or a dev shell never applies schema changes automatically.
- During local prototyping use explicit `db:push`. Generate the initial migration
  only when the design settles; test it on a fresh database, not a database already
  initialized by push. Commit migration files then, and never rewrite applied history.
  New migration history uses `app_migrations`, separate from the old application.
- `checks.database` type-checks the package, generates/migrates in a disposable
  PostgreSQL instance, repeats migrate/push, and checks constraints and preservation
  of a sentinel `public` table. Use the shared fixed-output npm cache offline; no
  live database or email service in builds. It never touches developer data.

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
  Nitro produces standalone Node servers. Keep one page per app for now.
- Use the stable Go-native TypeScript compiler (currently pinned to `7.0.2`).
  TypeScript 7 runs through `tsc`; a separate native-preview package is unnecessary.
  Update stable versions deliberately with the lockfile and Nix dependency hash.
- Shared components, theme tokens, fonts, and the reset live in `packages/react`
  (`@dsqr-dotdev/react`). Apps compose them; do not duplicate shared styling.
- The color palette is the owner's palette from master and is fixed: near-white
  and black in light, cool grey-black in dark, purple primary as the one accent.
  Map it into tokens exactly; never substitute or "improve" it without asking.
  Keep Geist typography. Evolve other StyleX tokens as decisions are made.
- Light/dark: every color token is `light-dark(light, dark)`, resolved by
  `color-scheme` on `<html>`. The inline theme script (`packages/react/src/theme.ts`)
  sets `data-theme` before paint from the stored choice or the system, and follows
  system changes live; the footer `ThemeToggle` stores an override and clears it
  when the choice matches the system again. React never renders `data-theme`.
  Style against the theme with inline `stylex.when.ancestor('[data-theme="dark"]')`
  (never hoisted into a variable) and never with `prefers-color-scheme` media.
- The root `browserslist` targets browsers with native `light-dark()`; without it
  LightningCSS rewrites the tokens into a broken polyfill. Keep it when updating.
- Every app renders the shared `Document` (tokens on `<html>`/`<body>`) in its root
  route and wraps each page in the shared `Page`: `main` stacking `Section`s and
  the footer at the bottom. `centered` places a single focal block (the Dotdev
  intro) in the middle of the viewport. There is no header or nav yet; add one
  only with real destinations, and never link to routes that do not exist.
  Every shared region aligns to `column.base` in
  `packages/react/src/styles/column.ts`; never re-derive width/gutters locally.
- Home-page voice, shared by Dotdev and Labs: `Stack` (centered or start column
  at the reading measure), `Prose` (the Geist Mono paragraph), `Mark` (dotted
  underline phrase; hue tones, `emphasis`, `quiet`), and `TextLink` (inline
  link, accent on hover). Compose these rather than restyling text per app.
- Labs is the DSQR Labs LLC page: its name, one `Prose` paragraph with
  `emphasis` marks, and the email as a `TextLink`, centered, shared footer.
- Dotdev's home is master's intro, ported as-is: a small centered portrait over
  one Geist Mono paragraph whose interests carry master's highlight `hues`
  (dotted underlines at half strength). Keep its copy and styling unless asked.
- The portrait is a transparent cutout (background removed with macOS Vision's
  subject lift), exported as AVIF/WebP with alpha: no frame, border, or shadow,
  with the shoulder fades baked into its alpha and fully transparent edges.
  Replace it the same way.
- Import images from `src/assets` so Vite fingerprints their URLs (no stale
  caches, immutable caching); `public/` is only for files that need fixed URLs.
- Screen-reader-only text uses the shared `visuallyHidden` style. Separate
  items in a row with the shared `Separator` (a quiet grey dot), not glyphs.
- `globals.css` is a token-free reset inside `@layer reset`, with the layer order
  declared first so StyleX's priority layers always win over it.
- No Tailwind or old UI stack without an explicit decision. Add only consumed
  components. Compile shared source through the app; type-check every workspace.
- `routeTree.gen.ts` is generated and ignored. Build before standalone typechecking
  in a fresh checkout. Keep environment secrets in ignored local files.

## Design principles

Direction: calm, minimal, comforting interfaces (September 2026). The structure is
minimal, but the feel is warm, not cold. Record new design decisions here as they
are made; tokens in `packages/react/src/styles/theme.stylex.ts` are the source of truth.

- Design is hierarchy: decide what is foreground, background, and hidden on each
  view, and let that shift with context. One job and one primary action per view.
  A spreadsheet-like dump of everything is a failure to choose, not a design.
- Group with space and alignment, not boxes. Use few borders and few cards, and
  never nest cards. Chrome (nav, footer, meta) recedes; content is the loudest thing.
- Spend boldness once per page: one memorable element, everything else quiet.
- Color: a small set of named OKLCH tokens (ground, surface, ink, muted, line,
  accent) holding master's palette in light and dark. The purple accent marks
  actionable things only. Meet WCAG AA text contrast; never put grey text on a
  colored ground.
- Type: Geist Variable (upright and italic) with weight and size doing the
  hierarchy work. Body 17px at 1.6, a 1.2 scale (`Heading` levels 1–3), and the
  38rem content column as the ~70ch measure. Dark mode body weight drops slightly
  (380) because light text blooms. `font-synthesis: none`: only real weights and
  italics render. `text-wrap: balance` on headings, `pretty` on paragraphs.
  `Text` is ink by default; `tone="muted"` is for supporting copy only.
  Spacing between elements belongs to the parent layout, never to primitives.
- Space follows a 4px-based scale with clamp()-driven section rhythm. Radius follows
  hierarchy (small for controls, larger for surfaces), never one value everywhere.
  Depth is flat or a single tinted, diffuse shadow.
- Motion answers the user (open, expand, confirm, navigate): 150–250ms ease-out,
  animate only `transform`/`opacity`, never `transition: all`, interruptible, no
  bounce. Allow at most one orchestrated load moment. Always honor
  `prefers-reduced-motion`. Prefer the View Transitions API for page continuity.
- Accessibility is infrastructure: keyboard-operable flows, visible soft
  `:focus-visible` rings, 24px minimum hit targets (44px touch), text labels with
  icons, and designed empty, loading, and error states.
- Fast is calm: few font files (subset, `font-display: swap`), no layout shift,
  sized images in modern formats.
- Copy is plain and kind: say what things do. Buttons name the action ("Save
  changes"), results reuse the verb ("Saved"), and errors say how to fix the
  problem. Empty states invite action.
- Avoid generated-looking tells: cream background + serif + terracotta; identical
  rounded card grids with gradient washes; all-caps tracked eyebrow labels;
  `A · B · C` meta strings; `→` on every link; mono for small labels; decorative
  blobs/grain; fade-slide-up on every section; hover lift on every card.
- Icons: inline SVG through the shared `Icon` component, no icon library. They
  use `currentColor`; brand marks are filled, interface glyphs are Lucide v0.552
  (main's set, 2px round strokes), and viewBoxes are tuned so they match optically. Icons are decorative;
  the control carries the name (visually hidden text, no `title` tooltips).
- Interactive controls: `controls` constants set glyph sizes and targets (32px,
  44px on any coarse pointer). Rest muted; hover (only under `hover: hover`) and
  focus turn the accent; focus adds a 2px accent ring; press scales to 0.92.
  Transition only `color`/`transform` on the `motion.fast` token.
- StyleX: tokens via `defineVars` (themeable) and `defineConsts` (fixed values,
  breakpoints); alternate themes via `createTheme`; motion via `keyframes` and
  `viewTransitionClass`. Components consume tokens and never hard-code colors.
- Before shipping UI, check mobile and desktop in light and dark, then remove one
  more accessory. Project-scoped design skills (`impeccable`, `animate`,
  `review-animations`, `apple-design`, `mobile-native`, `web-design-guidelines`)
  live untracked in `.claude/skills/` when installed locally.

## API standards

- Shared API code lives in `packages/api`; persistence lives in `packages/database`. Do not add a `core/` layer, empty packages, or domain scaffolds.
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
