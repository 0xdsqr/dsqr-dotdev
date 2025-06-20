{
  description = "🟪 dsqr-dotdev 🟪";
  inputs = {
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixpkgs-stable.url = "github:NixOS/nixpkgs/release-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs-unstable, nixpkgs-stable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs-unstable = import nixpkgs-unstable { inherit system; };
        pkgs-stable = import nixpkgs-stable { inherit system; };
      in {
        devShells = {
          default = pkgs-stable.mkShell {
            buildInputs = with pkgs-stable; [
              nodejs_22
              git
            ] ++ [
              pkgs-unstable.bun
            ];
            shellHook = ''
              echo "🟪 bingbong 🟪"
            '';
          };
        };
      });
}