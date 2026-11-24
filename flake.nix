{
  description = "dsqr-dotdev";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1";
    flake-parts = {
      url = "https://flakehub.com/f/hercules-ci/flake-parts/0.1";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
    treefmt-nix = {
      url = "https://flakehub.com/f/numtide/treefmt-nix/0.1";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "aarch64-darwin"
        "x86_64-linux"
        "aarch64-linux"
      ];
      imports = [
        inputs.treefmt-nix.flakeModule
        ./nix/treefmt.nix
        ./nix/devshell.nix
        ./nix/database.nix
        ./nix/checks.nix
        ./nix/packages
        ./nix/ci.nix
      ];
    };
}
