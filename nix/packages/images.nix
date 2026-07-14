{
  pkgs,
  dotdev,
  labs,
  studio,
}:
let
  imageEtc = pkgs.runCommand "homelab-image-etc" { } ''
        mkdir -p "$out/etc" "$out/tmp" "$out/var/empty"
        chmod 1777 "$out/tmp"
        cat > "$out/etc/passwd" <<EOF
    root:x:0:0:root:/root:/bin/sh
    nobody:x:65534:65534:nobody:/var/empty:/sbin/nologin
    EOF
        cat > "$out/etc/group" <<EOF
    root:x:0:
    nobody:x:65534:
    EOF
  '';

  mkImage =
    {
      name,
      package,
      port,
      command,
    }:
    let
      rootfs = pkgs.buildEnv {
        name = "${name}-rootfs";
        paths = [
          package
          pkgs.cacert
          imageEtc
        ];
        pathsToLink = [
          "/bin"
          "/etc"
          "/tmp"
          "/var"
        ];
      };
    in
    pkgs.dockerTools.buildLayeredImage {
      inherit name;
      tag = "latest";
      contents = rootfs;
      extraCommands = ''
        chmod 1777 tmp
      '';
      config = {
        Cmd = [ command ];
        User = "65534:65534";
        WorkingDir = "/var/empty";
        Env = [
          "NODE_ENV=production"
          "HOME=/var/empty"
          "HOST=0.0.0.0"
          "NITRO_HOST=0.0.0.0"
          "PORT=${toString port}"
          "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
          "TMPDIR=/tmp"
        ];
        ExposedPorts = {
          "${toString port}/tcp" = { };
        };
      };
    };
in
{
  dotdevImage = mkImage {
    name = "dotdev-web";
    package = dotdev;
    port = 3020;
    command = "/bin/dotdev";
  };

  studioImage = mkImage {
    name = "dotdev-studio";
    package = studio;
    port = 3021;
    command = "/bin/studio";
  };

  labsImage = mkImage {
    name = "dotdev-labs";
    package = labs;
    port = 3022;
    command = "/bin/labs";
  };
}
