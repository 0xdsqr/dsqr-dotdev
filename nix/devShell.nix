{ pkgs }:
pkgs.mkShell {
    buildInputs = with pkgs; [
        nodejs_22
        git
        bun
    ];
          
    shellHook = ''
        echo "🟪 development environment is ready..."
    '';
}