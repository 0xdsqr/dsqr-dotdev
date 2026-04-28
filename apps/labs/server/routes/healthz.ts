import { defineEventHandler, setHeader } from "nitro/h3"

export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/plain; charset=utf-8")
  return "ok\n"
})
