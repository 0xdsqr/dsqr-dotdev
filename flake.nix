{
  description = "Dave's nixworld";

  inputs = {
    # Core Nixpkgs + compatibility
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;

    # Developer tools / utilities
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    {
      self,
      nixpkgs,
      treefmt-nix,
      ...
    }@inputs:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
      bun2nixFor = system: import ./nix/bun2nix { pkgs = nixpkgs.legacyPackages.${system}; };
    in
    {
      # ------------------------------------------------------------
      # Development shell (nix develop .)
      # ------------------------------------------------------------
      devShells = forEachSystem (
        system:
        let
          devConfig = import ./nix/devshell.nix { inherit nixpkgs system; };
        in
        devConfig.devShells.${system}
      );

      # ------------------------------------------------------------
      # Packages
      # ------------------------------------------------------------
      packages = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          bun2nix = bun2nixFor system;
          appPackages = import ./nix/packages.nix { inherit pkgs self bun2nix; };
        in
        {
          inherit (appPackages) dotdev studio generate-deps;
          default = appPackages.dotdev;
        }
      );

      # ------------------------------------------------------------
      # Apps (nix run .#<name>)
      # ------------------------------------------------------------
      apps = forEachSystem (system: {
        generate-deps = {
          type = "app";
          program = "${self.packages.${system}.generate-deps}/bin/generate-deps";
        };
        dotdev = {
          type = "app";
          program = "${self.packages.${system}.dotdev}/bin/dotdev";
        };
        studio = {
          type = "app";
          program = "${self.packages.${system}.studio}/bin/studio";
        };
      });

      # ------------------------------------------------------------
      # NixOS module (import in your server config)
      # ------------------------------------------------------------
      nixosModules.default = import ./nix/nixos-module.nix { inherit self; };

      # ------------------------------------------------------------
      # bun2nix library (for use by other flakes)
      # ------------------------------------------------------------
      lib.bun2nix = bun2nixFor;

      # ------------------------------------------------------------
      # Formatter (nix fmt)
      # ------------------------------------------------------------
      formatter = forEachSystem (
        system:
        (treefmt-nix.lib.evalModule nixpkgs.legacyPackages.${system} ./nix/treefmt.nix).config.build.wrapper
      );

      # ------------------------------------------------------------
      # Checks (nix flake check)
      # ------------------------------------------------------------
      checks = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          bun2nix = bun2nixFor system;
          appPackages = import ./nix/packages.nix { inherit pkgs self bun2nix; };
        in
        {
          formatting = (treefmt-nix.lib.evalModule pkgs ./nix/treefmt.nix).config.build.check self;

          # Build checks — catches regressions in the Nix packaging
          build-dotdev = appPackages.dotdev;
          build-studio = appPackages.studio;
        }
      );
    };
}
