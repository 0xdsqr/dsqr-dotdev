{
  gnutar,
  images,
  jq,
  lib,
  runCommand,
}:
runCommand "dsqr-dotdev-image-runtime-check"
  {
    nativeBuildInputs = [
      gnutar
      jq
    ];
  }
  ''
    imageIndex=0
    for image in ${lib.escapeShellArgs (map toString images)}; do
      configPath="$(tar -xOf "$image" manifest.json | jq -er '.[0].Config')"
      tar -xOf "$image" "$configPath" | jq -e '
        .config.User == "65534:65534" and
        .config.WorkingDir == "/var/empty" and
        ((.config.Env | index("HOME=/var/empty")) != null) and
        ((.config.Env | index("TMPDIR=/tmp")) != null)
      ' >/dev/null

      root="$TMPDIR/image-$imageIndex"
      mkdir -p "$root"
      while IFS= read -r layer; do
        tar -xOf "$image" "$layer" | tar -xf - -C "$root"
      done < <(tar -xOf "$image" manifest.json | jq -er '.[0].Layers[]')

      test -d "$root/var/empty"
      test "$(stat -c %a "$root/tmp")" = 1777
      grep -Fxq 'nobody:x:65534:65534:nobody:/var/empty:/sbin/nologin' "$root/etc/passwd"

      if find "$root" -xdev -perm -0002 ! -path "$root/tmp" ! -path "$root/tmp/*" | grep -q .; then
        echo "image rootfs contains a world-writable path outside /tmp" >&2
        exit 1
      fi

      imageIndex=$((imageIndex + 1))
    done

    mkdir -p "$out"
    touch "$out/image-runtime-check"
  ''
