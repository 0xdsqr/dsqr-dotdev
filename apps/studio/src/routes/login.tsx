import { Button } from "@dsqr-dotdev/react/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsqr-dotdev/react/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@dsqr-dotdev/react/components/ui/input-otp"
import { Input } from "@dsqr-dotdev/react/components/ui/input"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { LoaderCircle, Shield } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { z } from "zod/v4"
import { authClient } from "../auth/client"
import { getAdminSessionUser } from "../lib/admin-access"

const emailSchema = z.string().email("Enter a valid email address.")
const otpSchema = z.string().length(6, "OTP must be 6 digits.")

export const Route = createFileRoute("/login")({
  loader: async () => {
    const adminUser = await getAdminSessionUser()

    if (adminUser) {
      throw redirect({ to: "/" })
    }

    return {}
  },
  component: StudioLoginPage,
})

function getErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback
  }

  const directMessage = Reflect.get(error, "message")
  if (typeof directMessage === "string") {
    return directMessage
  }

  const nestedError = Reflect.get(error, "error")
  if (nestedError && typeof nestedError === "object") {
    const nestedMessage = Reflect.get(nestedError, "message")
    if (typeof nestedMessage === "string") {
      return nestedMessage
    }
  }

  return fallback
}

function StudioLoginPage() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session?.user) {
      return
    }

    let cancelled = false

    void getAdminSessionUser().then((adminUser) => {
      if (cancelled) {
        return
      }

      if (adminUser) {
        void navigate({ to: "/" })
        return
      }

      setError("This account is signed in, but it does not have admin access.")
    })

    return () => {
      cancelled = true
    }
  }, [navigate, session?.user])

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email address.")
      return
    }

    setLoading(true)

    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })

      if (sendError) {
        setError(getErrorMessage(sendError, "Failed to send OTP."))
        setLoading(false)
        return
      }

      setStep("otp")
    } catch (sendError) {
      setError(getErrorMessage(sendError, "Failed to send OTP."))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    const result = otpSchema.safeParse(otp)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter the 6-digit code.")
      return
    }

    setLoading(true)

    try {
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email,
        otp,
      })

      if (verifyError) {
        setError(getErrorMessage(verifyError, "Invalid OTP."))
        setLoading(false)
        return
      }

      const adminUser = await getAdminSessionUser()

      if (!adminUser) {
        setError("This account does not have admin access.")
        await authClient.signOut()
        setStep("email")
        setOtp("")
        setLoading(false)
        return
      }

      void navigate({ to: "/" })
    } catch (verifyError) {
      setError(getErrorMessage(verifyError, "Failed to verify OTP."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-muted/40">
            <Shield className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.32em] text-muted-foreground">
              dsqr / studio
            </p>
            <CardTitle className="font-mono text-2xl font-semibold">admin sign in</CardTitle>
            <CardDescription className="text-sm leading-7">
              Studio is restricted to admin accounts only.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="me@dsqr.dev"
                disabled={loading || isPending}
                autoComplete="email"
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full font-mono" disabled={loading || isPending}>
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : "send otp"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter the six-digit code sent to{" "}
                  <span className="font-mono text-foreground">{email}</span>.
                </p>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading || isPending}
                >
                  <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 rounded-md border border-border text-sm font-mono"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex items-center gap-3">
                <Button type="submit" className="flex-1 font-mono" disabled={loading || isPending}>
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : "verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="font-mono"
                  disabled={loading || isPending}
                  onClick={() => {
                    setStep("email")
                    setOtp("")
                    setError("")
                  }}
                >
                  back
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
