{
  perSystem = { pkgs, ... }: {
    devShells.default = pkgs.mkShell {
      packages = with pkgs; [
        git
        nixfmt
        nodejs_24
        postgresql_18
      ];
    };

    formatter = pkgs.nixfmt;
  };
}
