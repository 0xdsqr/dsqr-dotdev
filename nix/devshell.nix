{
  pkgs,
  treefmtWrapper,
}:
pkgs.mkShell {
  packages = with pkgs; [
    git
    nodejs_24
    oxfmt
    oxlint
    postgresql
    treefmtWrapper
    typescript
  ];

  shellHook = ''
    export PATH="$PWD/node_modules/.bin:$PATH"

    echo "dsqr-dotdev dev shell"
    echo "  node:    $(node --version)"
    echo "  npm:     $(npm --version)"
    echo "  treefmt: $(treefmt --version | head -n 1)"
  '';
}
