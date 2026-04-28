{
  coreutils,
  gnused,
  lib,
  nginx,
  nodejs_24,
  stdenvNoCC,
  nodeModules,
}:
let
  src = import ../lib/source.nix { inherit lib; };
  workspaceLinks = import ../lib/workspace-links.nix;
in
stdenvNoCC.mkDerivation {
  pname = "dsqr-dotdev-labs";
  version = "0.0.0";
  inherit src;

  nativeBuildInputs = [ nodejs_24 ];

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

    npm run build:labs

    runHook postBuild
  '';

  installPhase = ''
        runHook preInstall

        mkdir -p "$out/bin" "$out/share/dotdev-labs/public" "$out/share/dotdev-labs/nginx"
        cp -R apps/labs/dist/. "$out/share/dotdev-labs/public/"

        cat > "$out/share/dotdev-labs/nginx/nginx.conf" <<'NGINX'
    worker_processes 1;
    error_log /dev/stderr warn;
    pid nginx.pid;

    events {
      worker_connections 1024;
    }

    http {
      include ${nginx}/conf/mime.types;
      default_type application/octet-stream;

      access_log /dev/stdout;
      sendfile on;

      server {
        listen @PORT@;
        server_name _;

        root @PUBLIC_ROOT@;
        index index.html;

        location / {
          try_files $uri $uri/ /index.html;
        }

        location = /healthz {
          access_log off;
          add_header Content-Type text/plain;
          return 200 "ok\n";
        }
      }
    }
    NGINX

        cat > "$out/bin/labs" <<EOF
    #!${stdenvNoCC.shell}
    set -eu
    port="\''${PORT:-3022}"
    runtime_dir="\''${TMPDIR:-/tmp}/dotdev-labs-nginx"
    ${coreutils}/bin/mkdir -p "\$runtime_dir"
    ${gnused}/bin/sed \
      -e "s|@PORT@|\$port|g" \
      -e "s|@PUBLIC_ROOT@|$out/share/dotdev-labs/public|g" \
      "$out/share/dotdev-labs/nginx/nginx.conf" > "\$runtime_dir/nginx.conf"
    exec ${nginx}/bin/nginx -p "\$runtime_dir" -c "\$runtime_dir/nginx.conf" -g 'daemon off;'
    EOF

        chmod +x "$out/bin/labs"

        runHook postInstall
  '';

  meta = {
    description = "Packaged static labs application for dsqr-dotdev";
    mainProgram = "labs";
    platforms = [
      "aarch64-darwin"
      "x86_64-linux"
    ];
  };
}
