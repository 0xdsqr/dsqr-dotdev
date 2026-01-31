# shellcheck shell=bash

# Hook to inject pre-fetched bun runtimes into the cache for offline cross-compilation.
#
# Required variable:
#   bunRuntimeDir - Path to derivation containing the runtime binary
#
# The runtime derivation should contain:
#   - The binary named bun-<arch>-v<version> (e.g., bun-linux-aarch64-v1.3.6)
#   - A cache-name file with the filename
#
# This hook must run AFTER bunConfigHook (which sets BUN_INSTALL_CACHE_DIR).

bunRuntimeHook() {
    echo "Executing bunRuntimeHook"

    if [[ -z "${bunRuntimeDir:-}" ]]; then
        echo "bunRuntimeHook: ERROR: bunRuntimeDir not defined!" >&2
        echo "" >&2
        echo "Add to your derivation:" >&2
        echo "  bunRuntimeDir = bunRuntimes.\"linux-arm64\";" >&2
        echo "" >&2
        exit 2
    fi

    if [[ ! -d "$bunRuntimeDir" ]]; then
        echo "bunRuntimeHook: ERROR: bunRuntimeDir does not exist: $bunRuntimeDir" >&2
        exit 2
    fi

    if [[ -z "${BUN_INSTALL_CACHE_DIR:-}" ]]; then
        echo "bunRuntimeHook: ERROR: BUN_INSTALL_CACHE_DIR not set!" >&2
        echo "" >&2
        echo "This hook must run after bunConfigHook." >&2
        echo "Make sure bunConfigHook is included in nativeBuildInputs." >&2
        exit 2
    fi

    local cacheNameFile="$bunRuntimeDir/cache-name"
    if [[ ! -f "$cacheNameFile" ]]; then
        echo "bunRuntimeHook: ERROR: cache-name file not found in $bunRuntimeDir" >&2
        exit 2
    fi

    local cacheName
    cacheName=$(cat "$cacheNameFile")
    local runtimeSrc="$bunRuntimeDir/$cacheName"

    if [[ ! -f "$runtimeSrc" ]]; then
        echo "bunRuntimeHook: ERROR: Runtime binary not found: $runtimeSrc" >&2
        exit 2
    fi

    echo "Injecting bun runtime: $cacheName"
    cp "$runtimeSrc" "$BUN_INSTALL_CACHE_DIR/$cacheName"
    chmod +x "$BUN_INSTALL_CACHE_DIR/$cacheName"

    echo "Runtime injected to: $BUN_INSTALL_CACHE_DIR/$cacheName"
    echo "bunRuntimeHook completed"
}

if [[ -z "${dontInjectBunRuntime:-}" ]]; then
    # Run after bunConfigHook (which sets BUN_INSTALL_CACHE_DIR in postConfigureHooks).
    # preBuildHooks runs after all configure phases complete.
    preBuildHooks+=(bunRuntimeHook)
fi
