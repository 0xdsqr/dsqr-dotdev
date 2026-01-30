import { createBuild } from "@dsqr-dotdev/build"
import * as path from "path"

await createBuild({
  rootDir: path.resolve(__dirname, ".."),
  onSuccess: (result) => {
    console.log(`✓ Build completed in ${result.duration}ms`)
    console.log(`  Entrypoints: ${result.entrypoints.length}`)
  },
  onError: (error) => {
    console.error(`✗ Build failed after ${error.duration}ms`)
    console.error(error.error)
    process.exit(1)
  },
})
