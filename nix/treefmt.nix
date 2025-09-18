{ pkgs, ... }:
{
  projectRootFile = "flake.nix";

  programs.nixfmt.enable = true;
  programs.biome.enable = true;

  settings.formatter.biome = {
    includes = [
      # JS/TS
      "**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"

      # JSON
      "**/*.{json,jsonc}"

      # CSS
      "**/*.css"
    ];

    excludes = [
      "*.min.js"
      "*.gen.ts"
      "routeTree.gen.ts"
      "node_modules/**"
      ".vite/**"
      "pkgs/*"
      "dist/**"
      "build/**"
    ];
  };
}
