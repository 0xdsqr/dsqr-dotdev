# shellcheck shell=bash

bunConfigHook() {
    echo "Executing bunConfigHook"

    local startTime=$SECONDS

    HOME=$(mktemp -d)
    export HOME

    # Disable telemetry and network features
    export BUN_DISABLE_TELEMETRY=1
    export DO_NOT_TRACK=1

    local offlineCache=""
    if [[ -n "${bunOfflineCache:-}" ]]; then
        offlineCache="$bunOfflineCache"
    fi

    if [[ -z "$offlineCache" ]]; then
        echo "bunConfigHook: ERROR: bunOfflineCache not defined!" >&2
        echo "" >&2
        echo "Add to your derivation:" >&2
        echo "  bunOfflineCache = bunDeps;" >&2
        echo "" >&2
        exit 2
    fi

    if [[ ! -d "$offlineCache" ]]; then
        echo "bunConfigHook: ERROR: bunOfflineCache path does not exist: $offlineCache" >&2
        exit 2
    fi

    local cacheLockfile="$offlineCache/bun.lock"
    local srcLockfile="$PWD/bun.lock"

    echo "Validating lockfile consistency..."

    if [[ ! -f "$srcLockfile" ]]; then
        echo "" >&2
        echo "ERROR: Missing bun.lock in source directory" >&2
        echo "Expected: $srcLockfile" >&2
        echo "" >&2
        echo "Ensure bun.lock is included in your source (check .gitignore)" >&2
        exit 1
    fi

    if [[ ! -f "$cacheLockfile" ]]; then
        echo "" >&2
        echo "ERROR: Missing bun.lock in cache" >&2
        echo "Expected: $cacheLockfile" >&2
        echo "" >&2
        echo "This usually means the cache was built incorrectly." >&2
        echo "Try regenerating: nix run .#generate-deps" >&2
        exit 1
    fi

    if ! @diff@ -q "$srcLockfile" "$cacheLockfile" > /dev/null 2>&1; then
        echo "" >&2
        echo "ERROR: Lockfile mismatch - bun-deps hash is outdated!" >&2
        echo "" >&2
        echo "The bun.lock in your source differs from the cached version." >&2
        echo "" >&2
        echo "To fix, regenerate the deps file:" >&2
        echo "  nix run .#generate-deps" >&2
        echo "" >&2
        exit 1
    fi

    echo "Lockfiles match"

    BUN_INSTALL_CACHE_DIR=$(mktemp -d)
    export BUN_INSTALL_CACHE_DIR

    echo "Copying cache to writable directory..."
    echo "  From: $offlineCache"
    echo "  To: $BUN_INSTALL_CACHE_DIR"

    local copyStart=$SECONDS

    cp -r "$offlineCache"/. "$BUN_INSTALL_CACHE_DIR"
    chmod -R u+w "$BUN_INSTALL_CACHE_DIR"

    echo "Cache copy took $((SECONDS - copyStart))s"

    echo "Running bun install..."
    echo "  Flags: @bunInstallFlags@"
    echo "  Cache dir: $BUN_INSTALL_CACHE_DIR"

    local installStart=$SECONDS

    if ! bun install @bunInstallFlags@; then
        echo "" >&2
        echo "ERROR: bun install failed" >&2
        echo "" >&2
        echo "Possible causes:" >&2
        echo "  - Cache is missing packages (regenerate deps)" >&2
        echo "  - Lockfile format incompatible" >&2
        echo "  - Bun version mismatch" >&2
        echo "" >&2
        echo "Try: nix run .#generate-deps" >&2
        exit 1
    fi

    echo "bun install took $((SECONDS - installStart))s"

    echo "Patching shebangs..."

    find . -path '*/.bin/*' -type f -exec chmod +x {} \; 2>/dev/null || true
    find . -path '*/bin/*.js' -type f -exec chmod +x {} \; 2>/dev/null || true

    if [ -d "node_modules/.bun" ]; then
        find node_modules/.bun -name '*.js' -type f -exec sh -c '
            head -1 "$1" 2>/dev/null | grep -q "^#!" && chmod +x "$1"
        ' _ {} \; 2>/dev/null || true
    fi

    while IFS= read -r -d '' nodeModulesDir; do
        echo "  Patching $nodeModulesDir..."
        patchShebangs --build "$nodeModulesDir"

        if [ -d "$nodeModulesDir/.bun" ]; then
            echo "  Patching $nodeModulesDir/.bun..."
            patchShebangs --build "$nodeModulesDir/.bun"
        fi
    done < <(find . -name 'node_modules' -type d -not -path '*/node_modules/.bun/*' -print0 2>/dev/null)

    echo "bunConfigHook completed in $((SECONDS - startTime))s"
}

if [[ -z "${dontBunInstallDeps:-}" ]]; then
    postConfigureHooks+=(bunConfigHook)
fi
