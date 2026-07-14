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
    resolveRootfsPath() {
      local containerPath="$1"
      local extractedPath="$root$containerPath"
      local linkTarget
      local linkDepth=0

      while test -L "$extractedPath"; do
        linkDepth=$((linkDepth + 1))
        if test "$linkDepth" -gt 16; then
          echo "image path $containerPath has too many symlink levels" >&2
          return 1
        fi

        linkTarget="$(readlink "$extractedPath")"
        case "$linkTarget" in
          *"/../"* | */.. | *"/./"* | */.)
            echo "image path $containerPath has an unsafe symlink target: $linkTarget" >&2
            return 1
            ;;
          /nix/store/*)
            extractedPath="$root$linkTarget"
            ;;
          *)
            echo "image path $containerPath has an unexpected symlink target: $linkTarget" >&2
            return 1
            ;;
        esac
      done

      printf '%s\n' "$extractedPath"
    }

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
        # GNU tar applies the builder's umask unless permissions are explicitly
        # preserved, which strips the sticky bit from the image's /tmp directory.
        tar -xOf "$image" "$layer" | tar -xpf - -C "$root"
      done < <(tar -xOf "$image" manifest.json | jq -er '.[0].Layers[]')

      varEmptyPath="$(resolveRootfsPath /var/empty)"
      if ! test -d "$varEmptyPath"; then
        echo "image rootfs is missing /var/empty" >&2
        exit 1
      fi

      tmpMode="$(stat -c %a "$root/tmp")"
      if test "$tmpMode" != 1777; then
        echo "image /tmp mode is $tmpMode; expected 1777" >&2
        exit 1
      fi

      passwdPath="$(resolveRootfsPath /etc/passwd)"
      if ! grep -Fxq 'nobody:x:65534:65534:nobody:/var/empty:/sbin/nologin' "$passwdPath"; then
        echo "image /etc/passwd is missing the unprivileged runtime user" >&2
        exit 1
      fi

      worldWritablePath="$(find "$root" -xdev -perm -0002 ! -path "$root/tmp" ! -path "$root/tmp/*" -print -quit)"
      if test -n "$worldWritablePath"; then
        echo "image rootfs contains a world-writable path outside /tmp: $worldWritablePath" >&2
        exit 1
      fi

      imageIndex=$((imageIndex + 1))
    done

    mkdir -p "$out"
    touch "$out/image-runtime-check"
  ''
