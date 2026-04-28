{
  description = "dsqr-dotdev";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      treefmt-nix,
      ...
    }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-linux"
      ];
    in
    flake-utils.lib.eachSystem systems (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ self.overlays.default ];
        };

        treefmtEval = treefmt-nix.lib.evalModule pkgs ./nix/treefmt.nix;
        packages = import ./nix/packages { inherit pkgs; };
      in
      {
        formatter = treefmtEval.config.build.wrapper;

        checks = import ./nix/checks {
          inherit packages pkgs;
          treefmtCheck = treefmtEval.config.build.check self;
        };

        devShells.default = import ./nix/devshell.nix {
          inherit pkgs;
          treefmtWrapper = treefmtEval.config.build.wrapper;
        };

        packages = packages // {
          default = packages.dotdev;
        };
      }
    )
    // {
      overlays.default = import ./nix/overlay.nix;
    };
}
