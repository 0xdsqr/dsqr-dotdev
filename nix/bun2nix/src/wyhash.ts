/**
 * wyhash implementation matching Bun's internal cache path hashing.
 *
 * Bun uses wyhash to compute cache directory names for packages with
 * pre-release or build metadata in their version strings. For example,
 * `react@19.0.0-beta.1` becomes `react@19.0.0-<wyhash("beta.1")>@@@1`.
 *
 * This implementation reverse-engineers Bun's cache layout to produce
 * compatible paths, enabling fully offline bun install in the Nix sandbox.
 *
 * DO NOT refactor the if/else chains in wyhashFinal — they match the
 * original C implementation's per-remainder-length handling and must
 * produce byte-identical hashes.
 */

const MASK64 = (1n << 64n) - 1n

const PRIMES = [
  0xa0761d6478bd642fn,
  0xe7037ed1a0b428dbn,
  0x8ebc6af09c88c6e3n,
  0x589965cc75374cc3n,
  0x1d8e4e27c47d124fn,
] as const

function readBytes(data: Uint8Array, offset: number, bytes: number): bigint {
  let result = 0n
  for (let i = 0; i < bytes; i++) {
    result |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return result
}

function read8BytesSwapped(data: Uint8Array, offset: number): bigint {
  return (readBytes(data, offset, 4) << 32n) | readBytes(data, offset + 4, 4)
}

function mum(a: bigint, b: bigint): bigint {
  const result = a * b
  const low = result & MASK64
  const high = result >> 64n
  return (high ^ low) & MASK64
}

function mix0(a: bigint, b: bigint, seed: bigint): bigint {
  return mum((a ^ seed ^ PRIMES[0]) & MASK64, (b ^ seed ^ PRIMES[1]) & MASK64)
}

function mix1(a: bigint, b: bigint, seed: bigint): bigint {
  return mum((a ^ seed ^ PRIMES[2]) & MASK64, (b ^ seed ^ PRIMES[3]) & MASK64)
}

// Process a 32-byte block
function wyhashRound(seed: bigint, b: Uint8Array, offset: number): bigint {
  const m0 = mix0(readBytes(b, offset, 8), readBytes(b, offset + 8, 8), seed)
  const m1 = mix1(
    readBytes(b, offset + 16, 8),
    readBytes(b, offset + 24, 8),
    seed,
  )
  return (m0 ^ m1) & MASK64
}

// Process the final 0-31 byte remainder
function wyhashFinal(data: Uint8Array, seed: bigint, msgLen: number): bigint {
  const len = data.length
  let s = seed

  if (len === 0) {
    // no-op
  } else if (len === 1) {
    s = mix0(readBytes(data, 0, 1), PRIMES[4], seed)
  } else if (len === 2) {
    s = mix0(readBytes(data, 0, 2), PRIMES[4], seed)
  } else if (len === 3) {
    s = mix0(
      (readBytes(data, 0, 2) << 8n) | readBytes(data, 2, 1),
      PRIMES[4],
      seed,
    )
  } else if (len === 4) {
    s = mix0(readBytes(data, 0, 4), PRIMES[4], seed)
  } else if (len === 5) {
    s = mix0(
      (readBytes(data, 0, 4) << 8n) | readBytes(data, 4, 1),
      PRIMES[4],
      seed,
    )
  } else if (len === 6) {
    s = mix0(
      (readBytes(data, 0, 4) << 16n) | readBytes(data, 4, 2),
      PRIMES[4],
      seed,
    )
  } else if (len === 7) {
    s = mix0(
      (readBytes(data, 0, 4) << 24n) |
        (readBytes(data, 4, 2) << 8n) |
        readBytes(data, 6, 1),
      PRIMES[4],
      seed,
    )
  } else if (len === 8) {
    s = mix0(read8BytesSwapped(data, 0), PRIMES[4], seed)
  } else if (len === 9) {
    s = mix0(read8BytesSwapped(data, 0), readBytes(data, 8, 1), seed)
  } else if (len === 10) {
    s = mix0(read8BytesSwapped(data, 0), readBytes(data, 8, 2), seed)
  } else if (len === 11) {
    s = mix0(
      read8BytesSwapped(data, 0),
      (readBytes(data, 8, 2) << 8n) | readBytes(data, 10, 1),
      seed,
    )
  } else if (len === 12) {
    s = mix0(read8BytesSwapped(data, 0), readBytes(data, 8, 4), seed)
  } else if (len === 13) {
    s = mix0(
      read8BytesSwapped(data, 0),
      (readBytes(data, 8, 4) << 8n) | readBytes(data, 12, 1),
      seed,
    )
  } else if (len === 14) {
    s = mix0(
      read8BytesSwapped(data, 0),
      (readBytes(data, 8, 4) << 16n) | readBytes(data, 12, 2),
      seed,
    )
  } else if (len === 15) {
    s = mix0(
      read8BytesSwapped(data, 0),
      (readBytes(data, 8, 4) << 24n) |
        (readBytes(data, 12, 2) << 8n) |
        readBytes(data, 14, 1),
      seed,
    )
  } else if (len === 16) {
    s = mix0(read8BytesSwapped(data, 0), read8BytesSwapped(data, 8), seed)
  } else if (len >= 17 && len <= 31) {
    s = mix0(read8BytesSwapped(data, 0), read8BytesSwapped(data, 8), seed)
    const rem = data.slice(16)
    const remLen = rem.length
    let extra: bigint
    if (remLen === 1) {
      extra = mix1(readBytes(rem, 0, 1), PRIMES[4], seed)
    } else if (remLen === 2) {
      extra = mix1(readBytes(rem, 0, 2), PRIMES[4], seed)
    } else if (remLen === 3) {
      extra = mix1(
        (readBytes(rem, 0, 2) << 8n) | readBytes(rem, 2, 1),
        PRIMES[4],
        seed,
      )
    } else if (remLen === 4) {
      extra = mix1(readBytes(rem, 0, 4), PRIMES[4], seed)
    } else if (remLen === 5) {
      extra = mix1(
        (readBytes(rem, 0, 4) << 8n) | readBytes(rem, 4, 1),
        PRIMES[4],
        seed,
      )
    } else if (remLen === 6) {
      extra = mix1(
        (readBytes(rem, 0, 4) << 16n) | readBytes(rem, 4, 2),
        PRIMES[4],
        seed,
      )
    } else if (remLen === 7) {
      extra = mix1(
        (readBytes(rem, 0, 4) << 24n) |
          (readBytes(rem, 4, 2) << 8n) |
          readBytes(rem, 6, 1),
        PRIMES[4],
        seed,
      )
    } else if (remLen === 8) {
      extra = mix1(read8BytesSwapped(rem, 0), PRIMES[4], seed)
    } else if (remLen === 9) {
      extra = mix1(read8BytesSwapped(rem, 0), readBytes(rem, 8, 1), seed)
    } else if (remLen === 10) {
      extra = mix1(read8BytesSwapped(rem, 0), readBytes(rem, 8, 2), seed)
    } else if (remLen === 11) {
      extra = mix1(
        read8BytesSwapped(rem, 0),
        (readBytes(rem, 8, 2) << 8n) | readBytes(rem, 10, 1),
        seed,
      )
    } else if (remLen === 12) {
      extra = mix1(read8BytesSwapped(rem, 0), readBytes(rem, 8, 4), seed)
    } else if (remLen === 13) {
      extra = mix1(
        read8BytesSwapped(rem, 0),
        (readBytes(rem, 8, 4) << 8n) | readBytes(rem, 12, 1),
        seed,
      )
    } else if (remLen === 14) {
      extra = mix1(
        read8BytesSwapped(rem, 0),
        (readBytes(rem, 8, 4) << 16n) | readBytes(rem, 12, 2),
        seed,
      )
    } else {
      extra = mix1(
        read8BytesSwapped(rem, 0),
        (readBytes(rem, 8, 4) << 24n) |
          (readBytes(rem, 12, 2) << 8n) |
          readBytes(rem, 14, 1),
        seed,
      )
    }
    s = (s ^ extra) & MASK64
  }

  const totalLen = BigInt(msgLen + len)
  return mum((s ^ totalLen) & MASK64, PRIMES[4])
}

/**
 * Compute the wyhash of an input string or byte array.
 *
 * Processes 32-byte aligned blocks via wyhashRound, then handles
 * the 0-31 byte remainder in wyhashFinal.
 */
export function wyhash(seed: bigint, input: string | Uint8Array): bigint {
  const data =
    typeof input === "string" ? new TextEncoder().encode(input) : input
  const alignedLen = data.length - (data.length % 32)

  let s = seed
  let msgLen = 0
  for (let off = 0; off < alignedLen; off += 32) {
    s = wyhashRound(s, data, off)
    msgLen += 32
  }
  return wyhashFinal(data.slice(alignedLen), s, msgLen)
}

/**
 * Compute Bun's cache directory path for a package specifier.
 *
 * Handles:
 * - Simple versions: `pkg@1.2.3` -> `pkg@1.2.3@@@1`
 * - Pre-release: `pkg@1.2.3-beta.1` -> `pkg@1.2.3-<hash>@@@1`
 * - Build metadata: `pkg@1.2.3+build` -> `pkg@1.2.3+<HASH>@@@1`
 * - Pre-release + build: both segments hashed (pre=lowercase, build=UPPERCASE)
 * - Tarball URLs: `tarball:<url>` -> `@T@<hash>@@@1`
 * - GitHub refs: `github:<ref>` -> `@GH@<ref>@@@1`
 * - Git hashes: `git:<hash>` -> `@G@<hash>`
 */
export function getCachePath(pkg: string): string {
  const SEED = 0n

  if (pkg.startsWith("tarball:")) {
    const url = pkg.slice("tarball:".length)
    const hash = wyhash(SEED, url)
    return `@T@${hash.toString(16).padStart(16, "0")}@@@1`
  }
  if (pkg.startsWith("github:")) {
    const path = pkg.slice("github:".length)
    return `@GH@${path}@@@1`
  }
  if (pkg.startsWith("git:")) {
    const hash = pkg.slice("git:".length)
    return `@G@${hash}`
  }

  const versionStart = pkg.lastIndexOf("@")
  if (versionStart <= 0) {
    return `${pkg}@@@1`
  }

  const name = pkg.slice(0, versionStart)
  const ver = pkg.slice(versionStart) // includes the @

  const preIndex = ver.indexOf("-")
  if (preIndex !== -1) {
    const version = ver.slice(0, preIndex)
    const preAndBuild = ver.slice(preIndex + 1)
    const buildIndex = preAndBuild.indexOf("+")
    if (buildIndex !== -1) {
      const pre = preAndBuild.slice(0, buildIndex)
      const build = preAndBuild.slice(buildIndex + 1)
      const preHash = wyhash(SEED, pre).toString(16).padStart(16, "0")
      const buildHash = wyhash(SEED, build)
        .toString(16)
        .toUpperCase()
        .padStart(16, "0")
      return `${name}${version}-${preHash}+${buildHash}@@@1`
    }

    const preHash = wyhash(SEED, preAndBuild).toString(16).padStart(16, "0")
    return `${name}${version}-${preHash}@@@1`
  }

  const buildIndex = ver.indexOf("+")
  if (buildIndex !== -1) {
    const version = ver.slice(0, buildIndex)
    const build = ver.slice(buildIndex + 1)
    const buildHash = wyhash(SEED, build)
      .toString(16)
      .toUpperCase()
      .padStart(16, "0")
    return `${name}${version}+${buildHash}@@@1`
  }

  return `${pkg}@@@1`
}

// Self-test: run with `bun run nix/bun2nix/src/wyhash.ts`
if (import.meta.main) {
  const testCases: [string, string][] = [
    [
      "react@1.2.3-beta.1+build.123",
      "react@1.2.3-c0734e9369ab610d+F48F05ED5AABC3A0@@@1",
    ],
    ["tailwindcss@4.0.0-beta.9", "tailwindcss@4.0.0-73c5c46324e78b9b@@@1"],
    ["react@1.2.3+build.123", "react@1.2.3+F48F05ED5AABC3A0@@@1"],
    ["react@1.2.3", "react@1.2.3@@@1"],
    ["undici-types@6.20.0", "undici-types@6.20.0@@@1"],
    ["@types/react-dom@19.0.4", "@types/react-dom@19.0.4@@@1"],
    [
      "react-compiler-runtime@19.0.0-beta-e552027-20250112",
      "react-compiler-runtime@19.0.0-0f3fc645a5103715@@@1",
    ],
    [
      "tarball:https://registry.npmjs.org/zod/-/zod-3.21.4.tgz",
      "@T@3be02e19198e30ee@@@1",
    ],
    ["github:colinhacks-zod-f9bbb50", "@GH@colinhacks-zod-f9bbb50@@@1"],
  ]

  let passed = 0
  let failed = 0

  for (const [input, expected] of testCases) {
    const result = getCachePath(input)
    if (result === expected) {
      console.log(`pass: ${input}`)
      passed++
    } else {
      console.log(`FAIL: ${input}`)
      console.log(`  expected: ${expected}`)
      console.log(`  got:      ${result}`)
      failed++
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}
