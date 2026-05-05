{
  pkgs,
  treefmtWrapper,
}:
pkgs.mkShell {
  packages = with pkgs; [
    age
    git
    jq
    kubectl
    kubernetes-helm
    nodejs_24
    oxfmt
    oxlint
    postgresql
    pulumi-bin
    sops
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
