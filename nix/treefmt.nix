{
  projectRootFile = "flake.nix";

  programs.nixfmt.enable = true;
  programs.biome = {
    enable = true;
    includes = [
      "*.js"
      "*.ts"
      "*.jsx"
      "*.tsx"
      "*.json"
    ];
    excludes = [
      "apps/dotdev/src/components/ui/*"
      "*.gen.ts"
    ];
    settings = {
      formatter = {
        indentStyle = "space";
        indentWidth = 2;
      };
      javascript = {
        formatter = {
          quoteStyle = "double";
          semicolons = "asNeeded";
        };
      };
      linter = {
        rules = {
          suspicious = {
            noExplicitAny = "warn";
            noArrayIndexKey = "off";
            noDoubleEquals = "warn";
          };
          a11y = {
            useSemanticElements = "off";
            useFocusableInteractive = "off";
            useKeyWithClickEvents = "off";
            useAriaPropsForRole = "off";
            noRedundantRoles = "off";
          };
          security = {
            noDangerouslySetInnerHtml = "off";
          };
        };
      };
    };
  };
}
