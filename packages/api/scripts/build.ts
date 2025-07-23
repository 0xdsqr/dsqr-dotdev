#!/usr/bin/env bun

import { $ } from "bun"

// Build TypeScript files
await $`tsc --build`

console.log("✅ Built packages/api")
