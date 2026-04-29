{
  pkgs,
  dotdev,
  labs,
  studio,
}:
let
  imageEtc = pkgs.runCommand "homelab-image-etc" { } ''
        mkdir -p "$out/etc"
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
          pkgs.bash
          pkgs.cacert
          imageEtc
        ];
        pathsToLink = [
          "/bin"
          "/etc"
        ];
      };
    in
    pkgs.dockerTools.buildLayeredImage {
      inherit name;
      tag = "latest";
      contents = rootfs;
      config = {
        Cmd = [ command ];
        Env = [
          "NODE_ENV=production"
          "HOST=0.0.0.0"
          "NITRO_HOST=0.0.0.0"
          "PORT=${toString port}"
          "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
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
