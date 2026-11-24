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
        # Helm templates are Go templates, not YAML.
        "helm/dsqr-app/templates/**"
        ".claude/**"
        ".agents/**"
        "skills-lock.json"
      ];
    };
  };
}
