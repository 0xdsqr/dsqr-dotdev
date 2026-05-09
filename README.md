<div align="center">

<h1>dsqr-dotdev</h1>

<p align="center">
  <a href="https://github.com/0xdsqr/dsqr-dotdev/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/0xdsqr/dsqr-dotdev/ci.yml?style=for-the-badge&branch=master&label=check" alt="Check"></a>
  <a href="https://github.com/0xdsqr/dsqr-dotdev/actions/workflows/publish-images.yml"><img src="https://img.shields.io/github/actions/workflow/status/0xdsqr/dsqr-dotdev/publish-images.yml?style=for-the-badge&branch=master&label=publish" alt="Publish"></a>
</p>

</div>

## Homelab migration

This repository owns the dsqr.dev apps, app image builds, Helm charts, and Pulumi/Haven infrastructure code. Host NixOS and nix-darwin configuration is intentionally managed outside this repo.

Useful checks:

```sh
nix flake check
nix build .#dotdev .#studio .#labs
nix build .#dotdevImage .#studioImage .#labsImage
npm run haven -- outputs
npm run gitops:render
npm run typecheck:infra:native
```

Cloudflare Access for Argo CD requires `CLOUDFLARE_ACCESS_ADMIN_EMAILS` in `.envrc.local` as a comma-separated allowlist, for example:

```sh
CLOUDFLARE_ACCESS_ADMIN_EMAILS=you@example.com,ops@example.com
```
