<div align="center">

<h1>dsqr-dotdev</h1>

<p align="center">
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
| `@dsqr-dotdev/core`     |
| `@dsqr-dotdev/database` |
| `@dsqr-dotdev/react`    |

## Helm

Helm chart source now lives in the shared homelab repo:

- `../homelab/infra/kubernetes/charts/dotdev-web`
- `../homelab/infra/kubernetes/charts/dotdev-studio`

This repo only builds and publishes application images.

## Commands

```bash
bun install
bun run dev:dotdev
bun run dev:studio
bun run build
bun run format
bun run lint
bun run typecheck
```
