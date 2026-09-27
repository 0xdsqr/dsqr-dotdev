{
  perSystem = { pkgs, ... }: {
    devShells.default = pkgs.mkShell {
      packages = with pkgs; [
        git
        nixfmt
        nodejs_24
      ];
    };

    formatter = pkgs.nixfmt;
  };
}
