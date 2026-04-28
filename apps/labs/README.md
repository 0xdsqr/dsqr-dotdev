# labs

Minimal Vite React single-page app for `labs.dsqr.dev`.

## Scripts

- `npm run dev:labs` starts Vite on port `3022`.
- `npm run build:labs` writes a static production build to `apps/labs/dist`.
- `npm run typecheck -w labs` runs TypeScript checks for this app.
- `npm run preview -w labs` serves the production build locally on port `3022`.

## Nix

- `nix build .#labs` builds the static app package.
- `nix build .#labsImage` builds the Kubernetes container image tarball.
