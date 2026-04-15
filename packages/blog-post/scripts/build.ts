import { createBuild } from "@dsqr-dotdev/build"
import * as path from "path"

await createBuild({
  rootDir: path.resolve(__dirname, ".."),
  external: ["react", "react-dom", "*"],
  onSuccess: (result) => {
    console.log(`✓ Blog post build completed in ${result.duration}ms`)
    console.log(`  Entrypoints: ${result.entrypoints.length}`)
  },
  onError: (error) => {
    console.error(`✗ Blog post build failed after ${error.duration}ms`)
    console.error(error.error)
    process.exit(1)
  },
})
