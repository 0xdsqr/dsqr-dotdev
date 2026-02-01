<div align="center">

<h1>dsqr-dotdev</h1>

<p align="center">
  <a href="https://github.com/0xdsqr/dsqr-dotdev/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/0xdsqr/dsqr-dotdev/test.yml?style=for-the-badge&branch=main&label=test" alt="Test"></a>
  <a href="https://github.com/0xdsqr/dsqr-dotdev/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/0xdsqr/dsqr-dotdev/deploy.yml?style=for-the-badge&branch=main&label=deploy" alt="Deploy"></a>
</p>

</div>

---

## Apps

| App | Port |
|-----|------|
| `dotdev` | 3000 |
| `studio` | 3001 |

## Packages

| Package |
|---------|
| `@dsqr-dotdev/core` |
| `@dsqr-dotdev/db` |
| `@dsqr-dotdev/ui` |
| `@dsqr-dotdev/blog-post` |

## Nix

### Packages

```bash
nix build .#dotdev
nix build .#studio
nix build .#generate-deps
```

### Apps

```bash
nix run .#dotdev
nix run .#studio
nix run .#generate-deps
```

### bun2nix

Exposed via `lib.bun2nix` for use by other flakes.

| Export | Description |
|--------|-------------|
| `bunConfigHook` | Setup hook for offline `bun install` in the Nix sandbox |
| `bunRuntimeHook` | Setup hook to inject pre-fetched Bun runtimes for cross-compilation |
| `fetchBunDeps` | Builds a Bun-compatible offline dependency cache from fixed-output derivations |

### NixOS Module

```nix
{
  imports = [ dsqr-dotdev.nixosModules.default ];

  services.dsqr-dotdev.dotdev = {
    enable = true;
    environmentFile = "/run/secrets/dotdev.env";
  };

  services.dsqr-dotdev.studio = {
    enable = true;
    environmentFile = "/run/secrets/studio.env";
  };
}
```