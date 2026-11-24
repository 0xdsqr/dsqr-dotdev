{
  perSystem =
    { config, pkgs, ... }:
    {
      devShells.default = pkgs.mkShell {
        packages = [
          config.treefmt.build.wrapper
        ]
        ++ (with pkgs; [
          git
          nixfmt
          oxlint
          actionlint
          zizmor
          kubernetes-helm
          nodejs_26
          postgresql_18
        ]);
      };
    };
}
