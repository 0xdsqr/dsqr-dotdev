import { serve } from "bun";
import { join } from "path";
import { statSync } from "fs";

const port = process.env.PORT || 3000;
const distPath = join(import.meta.dir, "dist");

function tryReadFile(path: string) {
  try {
    const stat = statSync(path);
    if (stat.isFile()) {
      return Bun.file(path);
    }
  } catch (e) {}
  return null;
}

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Serve static files from dist directory
    if (path === "/") {
      path = "/index.html";
    }
    
    // Try to find the file
    const filePath = join(distPath, path);
    const file = tryReadFile(filePath);
    
    if (file) {
      return new Response(file);
    }
    
    // If file not found, serve index.html for SPA routing
    const indexHtml = Bun.file(join(distPath, "index.html"));
    return new Response(indexHtml);
  },
});

console.log(`Server running at http://localhost:${port}`);