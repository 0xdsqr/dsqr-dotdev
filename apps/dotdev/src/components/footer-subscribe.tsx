"use client"

import { Button } from "@dsqr-dotdev/react/components/ui/button"
import { Input } from "@dsqr-dotdev/react/components/ui/input"
import { useMutation } from "@tanstack/react-query"
import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { trpcClient } from "@/lib/trpc"

const emailSchema = z.string().email("Enter a valid email.")

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return "Unable to subscribe right now."
}

export function FooterSubscribe() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"error" | "success" | null>(null)

  const subscribeMutation = useMutation({
    mutationFn: async (nextEmail: string) =>
      trpcClient.email.subscribe.mutate({ email: nextEmail }),
    onSuccess: () => {
      setEmail("")
      setMessageType("success")
      setMessage("Subscribed.")
      toast.success("Subscribed.")
    },
    onError: (error) => {
      const nextMessage = getErrorMessage(error)
      setMessageType("error")
      setMessage(nextMessage)
      toast.error(nextMessage)
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setMessageType(null)

    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setMessageType("error")
      setMessage(result.error.issues[0]?.message ?? "Enter a valid email.")
      return
    }

    subscribeMutation.mutate(result.data)
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email for new posts"
          autoComplete="email"
          disabled={subscribeMutation.isPending}
          className="h-9 min-w-0 flex-1 border-dotted font-mono text-sm"
        />
        <Button
          type="submit"
          variant="outline"
          className="h-9 border-dotted font-mono"
          disabled={subscribeMutation.isPending}
        >
          {subscribeMutation.isPending ? "…" : "subscribe"}
        </Button>
      </form>
      {message ? (
        <p
          className={`font-mono text-xs ${
            messageType === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
