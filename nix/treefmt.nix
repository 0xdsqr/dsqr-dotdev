{
  perSystem = _: {
    # `nix fmt` formats the tree; `checks.treefmt` (added by the module) fails CI on drift.
    treefmt = {
      projectRootFile = "flake.nix";
      programs = {
        nixfmt.enable = true;
        deadnix.enable = true;
        statix.enable = true;
        oxfmt.enable = true;
      };
      settings.global.excludes = [
        # Generated or owned by other tools: formatting them would fight their generators.
        "package-lock.json"
        "flake.lock"
        "packages/database/migrations/**"
        "**/routeTree.gen.ts"
        # The chart is versioned on every change (and its templates are Go templates, not YAML).
        "helm/**"
        ".claude/**"
        ".agents/**"
        "skills-lock.json"
      ];
    };
  };
}
