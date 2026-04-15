{
  description = "dsqr-dotdev";

  inputs = {
    nixpkgs.url = "https://channels.nixos.org/nixpkgs-unstable/nixexprs.tar.xz";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
  };

  outputs = { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              bun
              git
              nodejs_24
              postgresql
              typescript
            ];

            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"

              echo "dsqr-dotdev dev shell"
              echo "  node: $(node --version)"
              echo "  bun:  $(bun --version)"
            '';
          };
        }
      );
    };
}
