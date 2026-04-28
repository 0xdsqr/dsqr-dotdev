<div align="center">

<h1>dsqr-dotdev</h1>

<p align="center">
  <a href="https://github.com/0xdsqr/dsqr-dotdev/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/0xdsqr/dsqr-dotdev/ci.yml?style=for-the-badge&branch=master&label=check" alt="Check"></a>
  <a href="https://github.com/0xdsqr/dsqr-dotdev/actions/workflows/publish.yml"><img src="https://img.shields.io/github/actions/workflow/status/0xdsqr/dsqr-dotdev/publish.yml?style=for-the-badge&branch=master&label=publish" alt="Publish"></a>
</p>

</div>

---

## Apps

| App      | Port |
| -------- | ---- |
| `dotdev` | 3020 |
| `studio` | 3021 |

## Packages

| Package                 |
| ----------------------- |
| `@dsqr-dotdev/api`      |
| `@dsqr-dotdev/database` |
| `@dsqr-dotdev/react`    |

## Helm

Helm chart source now lives in the shared homelab repo:

- `../homelab/infra/kubernetes/charts/dotdev-web`
- `../homelab/infra/kubernetes/charts/dotdev-studio`

This repo only builds and publishes application images.

The image source of truth is Nix:

- CI runs `nix flake check`
- CI also builds `.#dotdevImage` and `.#studioImage`
- Publish builds those same Nix images and pushes them to GHCR

## Commands

```bash
npm ci
npm run dev:dotdev
npm run dev:studio
npm run build
npm run format
npm run lint
npm run typecheck
```

## Nix

```bash
nix flake check
nix build .#dotdev
nix build .#studio
nix build .#dotdevImage --out-link result-dotdev
nix build .#studioImage --out-link result-studio
docker load < result-dotdev
docker load < result-studio
docker run --rm -p 3020:3020 dotdev-web:latest
docker run --rm -p 3021:3021 dotdev-studio:latest
```
