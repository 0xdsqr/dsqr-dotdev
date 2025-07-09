{ pkgs-stable, pkgs-unstable }:

pkgs-stable.mkShell {
  buildInputs = with pkgs-stable; [
    nodejs_22
    git
    typescript
  ] ++ [
    pkgs-unstable.bun
  ];

  shellHook = ''
    echo "🟪 bingbong 🟪"
  '';
}