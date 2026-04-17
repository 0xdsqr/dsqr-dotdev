import { CopyButton } from "@dsqr-dotdev/react/components/copy-button"
import { createFileRoute } from "@tanstack/react-router"

const gpgFingerprint = "2885 E3DB B899 5B0C 0B43 8441 6908 FE14 2198 DB65"
const gpgKeyId = "6908FE142198DB65"
const gpgEmail = "me@dsqr.dev"
const gpgKeyUrl = "https://cdn.dsqr.dev/misc/0xdsqr.asc"

export const Route = createFileRoute("/misc")({
  loader: async () => {
    try {
      const response = await fetch(gpgKeyUrl, {
        headers: {
          Accept: "application/pgp-keys, text/plain;q=0.9, */*;q=0.1",
        },
      })

      if (!response.ok) {
        return { armoredPublicKey: null }
      }

      return {
        armoredPublicKey: await response.text(),
      }
    } catch {
      return { armoredPublicKey: null }
    }
  },
  component: MiscPage,
})

function MiscPage() {
  const { armoredPublicKey } = Route.useLoaderData()

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-muted-foreground">
          0xdsqr
        </p>
        <h1 className="inline-block border-b-2 border-dotted border-border pb-2 font-mono text-2xl font-bold">
          misc
        </h1>
      </div>

      <section className="space-y-5 border-b border-dashed border-border pb-8">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">gpg</p>
          <h2 className="text-xl font-semibold font-mono">Public key</h2>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Use this key if you need to verify something signed by me or encrypt something you want
            only me to read.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
            fingerprint
          </p>
          <p className="break-all font-mono text-sm leading-7 text-foreground">{gpgFingerprint}</p>
        </div>

        <dl className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
              key id
            </dt>
            <dd className="font-mono text-sm text-foreground">{gpgKeyId}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
              uid
            </dt>
            <dd className="font-mono text-sm text-foreground">0xdsqr &lt;{gpgEmail}&gt;</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href={gpgKeyUrl}
            target="_blank"
            rel="noreferrer"
            className="border-b border-dotted border-primary font-mono text-sm text-primary transition-opacity hover:opacity-80"
          >
            download public key
          </a>
          {armoredPublicKey ? (
            <details className="group">
              <summary className="cursor-pointer list-none border-b border-dotted border-border font-mono text-sm text-muted-foreground transition-colors hover:text-foreground">
                armored key →
              </summary>
              <div className="relative mt-4 max-w-3xl overflow-x-auto border-l-2 border-dotted border-border pl-4">
                <CopyButton value={armoredPublicKey} className="right-0 top-0" />
                <pre className="pr-12 font-mono text-xs leading-6 text-foreground">
                  <code>{armoredPublicKey}</code>
                </pre>
              </div>
            </details>
          ) : null}
          <a
            href="https://github.com/0xdsqr.gpg"
            target="_blank"
            rel="noreferrer"
            className="border-b border-dotted border-border font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            github public key endpoint
          </a>
        </div>
      </section>
    </div>
  )
}
