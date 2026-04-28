{
  lib,
  stdenvNoCC,
  nodejs_24,
  appName,
  nodeModules,
  port,
}:
let
  src = import ../lib/source.nix { inherit lib; };
  workspaceLinks = import ../lib/workspace-links.nix;
  defaultPort = toString port;
in
stdenvNoCC.mkDerivation {
  pname = "dsqr-dotdev-${appName}";
  version = "0.0.0";
  inherit src;

  nativeBuildInputs = [
    nodejs_24
  ];

  configurePhase = ''
    runHook preConfigure

    export HOME="$TMPDIR/home"
    mkdir -p "$HOME"

    cp -R ${nodeModules}/. .
    find . -type d -name node_modules -exec chmod -R u+w {} +

    ${workspaceLinks.linkWorkspacePackages}

    export PATH="$PWD/node_modules/.bin:$PATH"

    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild

    npm run build:database
    npm run build:api
    pushd "apps/${appName}" >/dev/null
    npm run build
    popd >/dev/null

    runHook postBuild
  '';

  installPhase = ''
        runHook preInstall

        mkdir -p "$out/app" "$out/bin"
        cp -R "apps/${appName}/.output" "$out/app/.output"
        cp -R node_modules "$out/app/node_modules"
        ${workspaceLinks.removeWorkspacePackageLinks}

        appDir="$out/app"

        cat > "$out/bin/${appName}" <<EOF
    #!${stdenvNoCC.shell}
    cd "$appDir"
    export NODE_ENV="\''${NODE_ENV:-production}"
    export HOST="\''${HOST:-0.0.0.0}"
    export NITRO_HOST="\''${NITRO_HOST:-0.0.0.0}"
    export PORT="\''${PORT:-${defaultPort}}"
    exec ${nodejs_24}/bin/node .output/server/index.mjs "\$@"
    EOF

        chmod +x "$out/bin/${appName}"

        runHook postInstall
  '';

  meta = {
    description = "Packaged ${appName} application for dsqr-dotdev";
    mainProgram = appName;
    platforms = [
      "aarch64-darwin"
      "x86_64-linux"
    ];
  };
}
