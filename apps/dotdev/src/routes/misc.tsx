import { createFileRoute } from "@tanstack/react-router"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/misc")({
  loader: async ({ context }) => {
    return context.queryClient.fetchQuery(
      context.trpc.misc.gpgData.queryOptions(),
    )
  },
  component: MiscPage,
})

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}

function MiscPage() {
  const { gpgKey, gpgFingerprint } = Route.useLoaderData() as {
    gpgKey: string
    gpgFingerprint: string
  }

  return (
    <div className="py-12 max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-2">Misc</h1>
      <p className="text-muted-foreground mb-12">
        Random things that don't fit elsewhere.
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 font-mono">GPG Key</h2>
          <div className="relative">
            <CopyButton value={gpgKey} />
            <pre className="p-4 pr-14 rounded-lg bg-card border border-border overflow-x-auto text-sm font-mono">
              {gpgKey}
            </pre>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 font-mono">Fingerprint</h2>
          <div className="relative">
            <CopyButton value={gpgFingerprint} />
            <pre className="p-4 pr-14 rounded-lg bg-card border border-border overflow-x-auto text-sm font-mono">
              {gpgFingerprint}
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
