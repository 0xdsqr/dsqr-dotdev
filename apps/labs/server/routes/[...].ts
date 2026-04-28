import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { defineEventHandler, setHeader } from "nitro/h3"

const indexHtml = readFile(join(process.cwd(), ".output/public/index.html"), "utf8")

export default defineEventHandler(async (event) => {
  setHeader(event, "content-type", "text/html; charset=utf-8")
  return await indexHtml
})
