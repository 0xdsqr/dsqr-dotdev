{
  description = "🟪 dsqr-dotdev 🟪";
  
  inputs = {
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixpkgs-stable.url = "github:NixOS/nixpkgs/release-24.11";
    flake-utils.url = "github:numtide/flake-utils";
    bunix.url = "github:0xdsqr/bunix";
  };
  
  outputs = { self, nixpkgs-unstable, nixpkgs-stable, flake-utils, bunix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs-unstable = import nixpkgs-unstable { inherit system; };
        pkgs-stable = import nixpkgs-stable { inherit system; };
        
        api = bunix.lib.${system}.buildBunPackage {
          src = ./.;
          workspace = "@dsqr-dotdev/api";
          version = "0.0.1";
        };
      in {
        packages = {
          default = api;
          api = api;
        };
        
        devShells = {
          default = pkgs-stable.mkShell {
            buildInputs = with pkgs-stable; [
              nodejs_22
              git
              bun
              bunix.packages.${system}.default
            ];
            
            shellHook = ''
              echo "🟪 bingbong 🟪"
            '';
          };
        };
      });
}