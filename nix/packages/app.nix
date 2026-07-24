{
  lib,
  stdenvNoCC,
  nodejs_24,
  nodejs-slim_24,
  appName,
  nodeModules,
  port,
  preBuildCommands ? "",
  runtimeDependencies ? [ ],
  sourcePaths,
}:
let
  appPackage = builtins.fromJSON (builtins.readFile ../../apps/${appName}/package.json);
  src = import ../lib/workspace-source.nix {
    inherit lib;
    paths = sourcePaths;
  };
  workspaceLinks = import ../lib/workspace-links.nix;
  defaultPort = toString port;
in
stdenvNoCC.mkDerivation {
  pname = "dsqr-dotdev-${appName}";
  version = appPackage.version;
  inherit src;

  nativeBuildInputs = [
    nodejs_24
  ];

  configurePhase = ''
    runHook preConfigure

    export HOME="$TMPDIR/home"
    mkdir -p "$HOME"

    cp -R ${nodeModules}/. .
    find . -type d -path '*/node_modules*' -exec chmod u+w {} +

    ${workspaceLinks.linkWorkspacePackages}

    export PATH="$PWD/node_modules/.bin:$PATH"

    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild

    ${preBuildCommands}
    pushd "apps/${appName}" >/dev/null
    npm run build
    popd >/dev/null

    runHook postBuild
  '';

  installPhase = ''
        runHook preInstall

        mkdir -p "$out/app" "$out/bin"
        cp -R "apps/${appName}/.output" "$out/app/.output"
        ${nodejs_24}/bin/node ${../lib/copy-runtime-dependencies.mjs} \
          "$PWD" \
          "$out/app" \
          ${lib.escapeShellArgs runtimeDependencies}

        for dependency in ${lib.escapeShellArgs runtimeDependencies}; do
          (
            cd "$out/app"
            ${nodejs_24}/bin/node -e \
              'require("node:module").createRequire(process.cwd() + "/runtime-check.cjs")(process.argv[1])' \
              "$dependency"
          )
        done

        # Guard against accidentally returning to the previous full-workspace
        # runtime closure. These packages are build/test tools, never app runtime
        # dependencies.
        test ! -e "$out/app/node_modules/typescript"
        test ! -e "$out/app/node_modules/vite"
        test ! -e "$out/app/node_modules/vitest"

        appDir="$out/app"

        cat > "$out/bin/${appName}" <<EOF
    #!${stdenvNoCC.shell}
    cd "$appDir"
    export NODE_ENV="\''${NODE_ENV:-production}"
    export HOST="\''${HOST:-0.0.0.0}"
    export NITRO_HOST="\''${NITRO_HOST:-0.0.0.0}"
    export PORT="\''${PORT:-${defaultPort}}"
    exec ${nodejs-slim_24}/bin/node .output/server/index.mjs "\$@"
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
