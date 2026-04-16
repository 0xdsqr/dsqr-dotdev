import { CopyButton } from "@dsqr-dotdev/react/components/copy-button"
import { createFileRoute } from "@tanstack/react-router"

const gpgFingerprint = "2885 E3DB B899 5B0C 0B43 8441 6908 FE14 2198 DB65"
const gpgKeyId = "6908FE142198DB65"
const gpgEmail = "me@dsqr.dev"

const armoredPublicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
jcT+aA==
=D+qh
-----END PGP PUBLIC KEY BLOCK-----`

export const Route = createFileRoute("/misc")({
  component: MiscPage,
})

function MiscPage() {
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
            href="/keys/0xdsqr.asc"
            className="border-b border-dotted border-primary font-mono text-sm text-primary transition-opacity hover:opacity-80"
          >
            download public key
          </a>
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
