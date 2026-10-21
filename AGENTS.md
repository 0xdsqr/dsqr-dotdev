# Project context

dsqr-dotdev: the dsqr.dev site, Labs, and Studio, developed directly on `master`.

## Scope standards

- Keep the starter minimal. Implement only the current request; record future
  standards here without building that infrastructure ahead of time.
- Current scope: the Dotdev intro and Labs pages, a hello-world Studio app, shared React/StyleX
  and API packages, an Effect HttpApi per app, Nix app/Linux image builds,
  a local PostgreSQL/Drizzle subscription schema, and Dotdev's newsletter signup
  (stores the address only), and CI that checks, scans, and publishes images to
  GHCR, and a hardened shared Helm chart for Indigo. No auth or deployment
  workflows yet; CI publishes images but never changes the cluster.
- Keep guidance in this file. Do not create `docs/` or speculative packages.
- Commit and push straight to `master`; no feature branches or PRs unless asked.
- Work in this checkout; no worktrees unless requested. Leave unrelated changes
  alone. The deferred deployment setup is saved on `codex/deployment-baseline`.
- Keep Dotdev on port 3030, Labs on 3031, and Studio on 3032. Keep hot updates
  working for app components, shared components, and StyleX tokens.

## Nix standards

- Nix owns the toolchain, builds, and checks. Keep `flake.lock` committed; update
  pins intentionally. Pinning enables repeatability, not automatic security fixes.
- Flake inputs come from FlakeHub (`nixpkgs` 0.1 is the rolling unstable channel)
  for semver-resolved, fast tarball fetches. A weekly workflow opens a
  `flake.lock` update PR; review it like any dependency bump.
- CI tooling lives in `nix/ci.nix` as `writeShellApplication` apps
  (`ci-image-scan`, `ci-image-push`, `ci-image-index`): shellchecked, pinned by
  `flake.lock`, and runnable locally. Workflows stay thin and call them.
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
  ci.nix               CI apps for image scan, push, and index
helm/
  dsqr-app/            One chart, separate Dotdev/Labs/Studio releases
.github/
  actions/setup-nix/   Determinate Nix + FlakeHub Cache
  workflows/           CI and weekly flake.lock updates
```

- `apps/*` are deployable applications; `packages/*` are reusable source packages.
  Use direct names (`api`, `react`, `database`), not a generic `core/` layer.
- Apps may import shared packages. Packages must not import apps or create cyclic
  dependencies. React components remain independent of API/database runtime code.
- Consumers use package exports, never reach into another package's `src/`.
  Browser-safe types and server runtime code have separate exports. Name server
  implementation files `*.server.ts` so Start's import protection can reject leaks.
- Every workspace owns a complete `tsconfig.json` (no shared base): strict,
  `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`,
  `isolatedModules`, Bundler resolution, `noEmit`, plus only the libs and ambient
  types it needs. Each has a `typecheck` script covering its entire source. The root command checks all workspaces, not
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
- The pool sets a 10 s statement and idle-in-transaction timeout and recycles
  connections after 30 min; `ping(db)` backs health checks. Nitro's graceful
  shutdown force-exits, so no signal handlers; `closeDatabase()` exists for a
  Nitro `close` hook if forced exit is ever disabled. Imports are extensionless.
- `packages/database` owns schema and the server-only connection factory. It has
  its own TypeScript config; no emitted library build or eager connection on import.
  API code owns subscription behavior and email delivery; React never imports DB code.
- `app.subscriptions` is independent of accounts: UUIDv7 key (PostgreSQL 18
  `uuidv7()`), unique normalized email,
  pending/subscribed/unsubscribed status, and timezone-aware timestamps. Validate
  email syntax in the future API; the DB enforces nonempty lowercase/trimmed values,
  uniqueness, allowed statuses, and a timestamp for unsubscribed records.
  Drizzle updates `updated_at`; raw SQL must update it explicitly.
- Repeated signup must not reactivate unsubscribed people without new confirmation.
  Preserve opt-outs during import; do not invent confirmation dates.
  Confirmation, unsubscribe, sending, and Resend contact sync are future work.
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
  PostgreSQL instance, repeats migrate/push, and checks that a sentinel `public`
  table survives. There are no unit tests for now; they return later. Use the shared fixed-output npm cache offline; no
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
- Images publish to `ghcr.io/0xdsqr/{dotdev-web,dotdev-labs,dotdev-studio}`.
  Deploy by digest (`image@sha256:...`), never by tag; `sha-<commit>` and
  `master` tags exist only for humans.

## CI standards

- `.github/workflows/ci.yml` runs on pushes to `master`, pull requests, and
  manual dispatch: `nix flake check` (including the `workflows` lint check), then
  each image on native x86_64 and aarch64 runners: build, Trivy scan (fails on
  fixable HIGH/CRITICAL), and a CycloneDX SBOM. CodeQL scans TypeScript and the
  workflows. The `Required checks` job gates on all of them and is the status
  check the `master` ruleset requires; keep its name stable. Pull requests stop
  there.
- On `master`, each architecture image is pushed (OCI) with an SBOM attestation,
  combined into one multi-architecture index tagged `sha-<commit>` and `master`,
  and given a build provenance attestation. The `image-digests` artifact
  (`images.json`, 90 days) and the run summary record every immutable digest;
  verify with `gh attestation verify oci://<image>@<digest> --owner 0xdsqr`.
- CI publishes with the job's `GITHUB_TOKEN` only (`packages: write`). It holds no
  cluster credentials and never deploys; clusters pull digests themselves.
- Workflows start from `permissions: {}` and grant per job. Pin every action to a
  full commit SHA with the version in a trailing tag comment; bump pins
  deliberately (no Dependabot for now). Check out with
  `persist-credentials: false`. Set `timeout-minutes` on every job.
- The `workflows` check runs actionlint and zizmor (medium and above) over
  `.github`, so CI lints itself. Run it locally before pushing workflow changes.
- Nix runs through `.github/actions/setup-nix` (Determinate Nix and FlakeHub
  Cache via OIDC, so jobs that use it need `id-token: write`).

## Helm standards

`helm/dsqr-app` is the shared application chart. Select `values-dotdev.yaml`,
`values-labs.yaml`, or `values-studio.yaml`, then apply infrastructure-owned values.

- Deploy immutable registry digests; require an explicit repository and digest.
- Use non-root execution, read-only root filesystems, dropped capabilities,
  `allowPrivilegeEscalation: false`, and `RuntimeDefault` seccomp.
- Disable automatic service-account tokens unless the application needs the API.
- Provide startup/readiness/liveness probes and explicit resource requests/limits.
- Keep secrets outside charts/images. Choose ingress, TLS, and network policy for
  the actual cluster. Validate rendering/security through `checks.helm`.
- Chart version follows SemVer independently of application images. Bump it for
  chart changes; application promotion changes the image digest in infrastructure.
  Argo CD can render this Git-hosted chart; chart registry publishing is not needed.
- Labs/Studio default to three replicas on `applications` workers (04–06), with
  hostname topology spread and a one-pod disruption budget. Three VMs on one
  physical host do not provide physical-host fault tolerance. Capacity and live
  scheduling still need validation when deploying.
- Every app rolls out with RollingUpdate (`maxSurge: 1`, `maxUnavailable: 0`).
  All probes use `/api/livez`: readiness must not depend on the database, or a
  database blip takes the whole site offline when only signup needs it.
  `/api/healthz` reports dependency health for monitoring and alerts.
- Dotdev is schema-guarded at one replica while rate limits remain process-local;
  a rollout's brief two-pod overlap only doubles per-process limits for seconds. Before allowing multiple replicas, implement shared atomic
  rate limits with expiry and explicit backend-failure behavior, validate the
  trusted proxy/client-IP chain, and test concurrent requests across replicas.
  Then update the chart guard, rollout strategy, profile and checks together.
- `trustProxy` defaults false. Do not enable it yet: the app takes the rightmost
  X-Forwarded-For hop, which behind Cloudflare and Envoy is a proxy, not the
  visitor. First make the app trust a configured hop count (or Envoy's client
  address header with Envoy's trusted hops set), then verify header sanitization.
  With it off, per-client limits are skipped; per-address and global still apply.
- Dotdev sets `trustedOrigins` to `https://dsqr.dev`: Envoy terminates TLS, so
  without a trusted proxy the app sees `http://` and would otherwise rely solely
  on `Sec-Fetch-Site` for same-origin writes.
- Dotdev deployment inputs are `database.existingSecret` (key `DATABASE_URL`),
  `database.caConfigMap` (key `ca.crt`), and the actual database IPv4 `address`
  and `port`. No database, credentials, migrations or migration hooks are bundled.
  Schema readiness, migrations and database availability are separate rollout gates.
- Ingress is only from shared Envoy pods; egress is only CoreDNS and, for Dotdev,
  the configured database /32 and port. Policies are additive: infrastructure
  must ensure no other namespace policy widens these permissions. Add future
  service dependencies explicitly, never a blanket internet allowance.
- Infrastructure owns namespaces (Restricted PSA and the
  `platform.dsqr.dev/gateway-access: shared` label), ESO resources, CA trust,
  gateway-side egress permission, Argo applications, tunnel routes and DNS.
  `route.enabled` only creates an HTTPRoute attached to `gateway-system/shared`
  listener `https`; it does not make the application publicly reachable alone.
- `checks.helm` runs strict Helm lint, deterministic rendering for all profiles,
  offline pinned Kubernetes 1.36/Gateway API 1.5 schema validation, security and
  scheduling contracts, and negative-value cases. It has no cluster credentials;
  it does not replace server-side admission/CEL or live rollout checks.

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
- Labs is the DSQR Labs LLC page: the "square, squared" mark (`LabsMark`: a
  purple squircle with a faint, lighter squircle in its top-right corner like a
  quiet exponent, since dsqr is "d squared") as the h1 with the name visually hidden, one `Prose` paragraph
  with `emphasis` marks, and the email as a `TextLink`, centered, shared footer.
  The same mark is every app's favicon: `@dsqr-dotdev/react/mark.svg`, linked
  as `rel="icon"` in each root route.
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
- Form controls: `Input` (`outlined`, or `bare` inside a `FieldGroup`, which
  draws one hairline border that turns the accent on focus-within) and `Button`
  (`solid` for a page's one primary action; `quiet` is text toned like the icon
  controls, muted then accent). Footer controls stay quiet: no filled buttons.
- The footer is one centered axis, like the pages: social links · theme toggle,
  then an optional `action` (Dotdev's `SitePage` passes the subscribe field on
  every page), then the copyright as a small line in the intro's Geist Mono,
  all on one even row gap. Same arrangement at every width. The page grid column
  is `minmax(0, 1fr)` so no control's intrinsic width can widen the page.
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

## Effect standards

Effect (v4, pinned exactly to `4.0.0-beta.107`) is the primary way this project
models logic, errors, dependencies, validation, and HTTP. References: the Effect
guide shipped in `node_modules/effect/AGENTS.md` and `ai-docs/` (prefer these and
the installed source over outside docs), OpenCode, and Executor.

- Write Effect code with `Effect.gen` and `Effect.fn("Service.method")`; attach
  behaviour with combinators. Never build functions that return `Effect.gen`.
- Model every dependency as a service: `class X extends Context.Service<X, Shape>()("@dsqr-dotdev/<package>/X")`
  with `static readonly layer`. Compose with `Layer.provide`/`provideMerge`;
  resources use `Effect.acquireRelease` inside the layer so they close with it.
- Errors are `Schema.TaggedError` classes (with `httpApiStatus` when they cross
  HTTP). Handle them with `Effect.catchTag`; turn unexpected failures into
  defects with `Effect.orDie` at the handler boundary (clients get a bare 500).
- All validation and domain modeling uses Effect `Schema`: no predicates, manual
  parsing, or other schema libraries. Forms decode with the same schema the API
  uses (`Schema.decodeUnknownResult`), so messages match and invalid input never
  hits the network.
- Configuration comes from `Config`, read when a layer is built, never per
  request. Use the typed readers (`Config.boolean`, `Config.literals`,
  `Config.redacted` for secrets) instead of string comparisons; parse anything
  that can throw (URLs, files) with `Effect.try` into a tagged error.
- Values with a sensible default are a `Context.Reference` (for example
  `HealthCheck`, which defaults to `Effect.void` and is overridden per app).
- Layers passed together to `Layer.provide([...])` are siblings and cannot see
  each other; wrap cross-cutting layers (the `LoggerLive` logger) around the
  whole app with `Layer.provideMerge` so every layer and request uses them.
- Non-Effect callbacks (driver events, timers) run Effects through
  `Effect.runForkWith(yield* Effect.context())`, never bare `Effect.runFork`, so
  they keep the app's logger and services.
- Log through Effect (`Effect.logInfo`/`logWarning`/`logError`), never
  `console`. `LoggerLive` writes JSON lines in production and the pretty logger
  in development. Never log secrets or subscriber emails. `HttpPolicy` holds request policy
  (TRUST_PROXY, TRUSTED_ORIGINS).
- Upgrade Effect deliberately: bump every `effect`/`@effect/*` package to the
  same exact version, update the lockfile and Nix hash, and re-run all apps.
  `effect/unstable/*` modules may change between betas.

## API standards

- `packages/api/src` follows Effect's HttpApi layout. Browser-safe: `domain/`
  (schemas, tagged errors), `api/` (`HttpApiGroup`s and the per-app `HttpApi`s:
  `AppApi` for Labs/Studio, `DotdevApi`), `index.ts`, and `client.ts`
  (`AtomHttpApi` clients `AppClient` and `DotdevClient`). Server-only
  (`*.server.ts`, kept for Start's import protection): `server/` services
  (`Subscriptions`, `RateLimiter`, `HttpPolicy`, `HealthCheck`), `server/http/`
  handler layers (`HttpApiBuilder.group`), `probes.server.ts`,
  `origin.server.ts`, `logging.server.ts`, and
  `app.server.ts`, which composes each app's layer and exports lazily built web
  handlers (`dotdevHandler`, `appHandler`) via `HttpRouter.toWebHandler`.
- API contracts never import server code. New features add a domain schema, an
  endpoint in a group, a service with a layer, and a handler layer; mount a group
  only in the apps that need it.
- Each app mounts its handler in one TanStack Start server route, `/api/$` (GET,
  POST); the API owns every path under `/api`, including the probes. The handler caps request bodies at 4 KB as
  byte streams before Effect sees them (Effect's `MaxBodySize` covers multipart
  only); the global origin guard rejects cross-origin writes before routing,
  comparing the full origin (scheme from X-Forwarded-Proto only when TRUST_PROXY=1).
- React calls the API through `AtomHttpApi` query and mutation atoms with
  `@effect/atom-react` hooks; each app root renders a `RegistryProvider`. Keep
  presentational components plain React; Effect belongs in data and logic.
  Queries that need the browser's origin render after mount; add SSR hydration
  (`effect/unstable/reactivity/Hydration`) with the first server-fetched data.
- `packages/database` exposes the `Database` service: Drizzle over a `pg` pool
  acquired in the layer's scope (closed when the runtime disposes). It reads
  config with `Config`; if that fails, the layer still builds as an unavailable
  service so `/api/livez` stays up and `/api/healthz` reports 503. Config
  errors (including an unreadable CA file or malformed URL) fail into this path.
- Subscriptions (Dotdev only): `POST /api/subscriptions` decodes the payload with
  `SubscribeRequest`, applies the global (500/10 min), per-client (20/10 min,
  only when TRUST_PROXY=1 identifies the rightmost X-Forwarded-For hop), then
  per-address (3/hour) limits via `RateLimiter` (bounded to 10,000 windows,
  oldest evicted first), and stores the row with `onConflictDoNothing`. Every accepted request answers
  `{ status: "accepted" }` whatever the row's state, so responses never reveal
  whether an address is on the list. `RateLimited` returns 429.
  Confirmation, unsubscribe, and delivery arrive later with Resend.
- Development uses the local socket database until `DSQR_DATABASE=remote`;
  production requires DATABASE_URL and PGSSLROOTCERT. With a CA, the driver gets
  only the URL's connection fields plus an explicit `ssl`. Rate limits live in
  process memory: move them to a shared store before running several instances.
- Probes on every app's API: `/api/livez` (process up, no dependencies) and
  `/api/healthz`
  (dependencies; Dotdev pings the database with a 2 s timeout). Plain
  `ok`/`unavailable`, `Cache-Control: no-store`, no details.
- Add authentication with the first protected feature as `HttpApiMiddleware`
  plus role/ownership checks per operation; UI checks never authorize. Add
  bounded schemas, explicit response fields, and pagination as endpoints grow.

## Working commands

```sh
nix develop --command npm ci
nix run .#dev                            # Dotdev: http://127.0.0.1:3030
nix run .#dev-labs                       # Labs: http://127.0.0.1:3031
nix run .#dev-studio                     # Studio: http://127.0.0.1:3032
nix build .#dotdev .#labs .#studio        # Production apps
nix run .                               # Production server, port 3000
nix build .#dotdev-image .#labs-image .#studio-image # Linux builder
nix build .#checks.aarch64-darwin.workflows  # lint workflows (actionlint + zizmor)
nix build .#checks.aarch64-darwin.helm       # offline Helm/schema/security checks
nix run .#ci-image-scan -- result image.cdx.json # scan an image archive
nix fmt flake.nix nix/*.nix nix/checks/*.nix nix/packages/*.nix
nix flake check --no-update-lock-file --option sandbox true --option sandbox-fallback false
nix flake check --all-systems --no-build --no-update-lock-file
# After building/priming inputs, force an offline repeat and compare:
nix build .#dotdev .#labs .#studio --rebuild --offline --option substitute false --option sandbox true --option sandbox-fallback false --no-link --no-update-lock-file
```

Stage new files explicitly before Git-backed flake commands; avoid `git add .`.
The `smoke` check verifies toolchain execution. Each app check builds/type-checks
that app and both shared packages, then checks HTML, the public API, origin guard,
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
- [Effect](https://github.com/Effect-TS/effect) (v4; `node_modules/effect/AGENTS.md`)
- [Executor Effect + TanStack Start app](https://github.com/UsefulSoftwareCo/executor)
- [OpenCode Effect usage](https://github.com/anomalyco/opencode)
- [TanStack Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
