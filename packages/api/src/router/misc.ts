import { createTRPCRouter, publicProcedure } from "../trpc.js"

export const miscRouter = createTRPCRouter({
  gpgData: publicProcedure.query(async () => {
    try {
      const [keyRes, fingerprintRes] = await Promise.all([
        fetch("https://cdn.dsqr.dev/static/misc/gpg-key.txt"),
        fetch("https://cdn.dsqr.dev/static/misc/fingerprint.txt"),
      ])

      const gpgKey = await keyRes.text()
      const gpgFingerprint = await fingerprintRes.text()

      return {
        gpgKey,
        gpgFingerprint,
        success: true,
      }
    } catch (_error) {
      throw new Error("Failed to fetch GPG data")
    }
  }),
})
