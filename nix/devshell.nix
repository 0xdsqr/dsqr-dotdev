{
  perSystem = { pkgs, ... }: {
    devShells.default = pkgs.mkShell {
      packages = with pkgs; [
        git
        nixfmt
        kubernetes-helm
        nodejs_24
        postgresql_18
      ];
    };

    formatter = pkgs.nixfmt;
  };
}
