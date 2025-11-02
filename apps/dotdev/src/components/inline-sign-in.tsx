"use client"

import type React from "react"
import { useState } from "react"
import { z } from "zod"
import { authClient } from "@/auth/client"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { UserDropdown } from "./user-dropdown"

const emailSchema = z.string().email("Invalid email")
const otpSchema = z.string().length(6, "OTP must be 6 digits")

export function InlineSignIn() {
  const { data: session, isPending } = authClient.useSession()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)

    try {
      // TODO: implement sendVerificationOTP() in auth config to send email via Resend
      const { error: sendError } =
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        })

      if (sendError) {
        setError("Failed to send OTP")
        setLoading(false)
        return
      }

      setStep("otp")
      setLoading(false)
    } catch {
      setError("Failed to send OTP")
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = otpSchema.safeParse(otp)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)

    const { error: verifyError } = await authClient.signIn.emailOtp({
      email,
      otp,
    })

    if (verifyError) {
      setError("Invalid OTP")
      setLoading(false)
      return
    }

    setOtp("")
    setEmail("")
    setStep("email")
    setLoading(false)
  }

  if (isPending) {
    return null
  }

  if (session?.user) {
    return <UserDropdown email={session.user.email} />
  }

  if (step === "email") {
    return (
      <form onSubmit={handleSendOTP} className="flex items-center gap-2">
        <label className="text-purple-600 dark:text-purple-400 text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400">
          sign in
        </label>
        <div className="flex flex-col">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent text-xs border-0 border-b-2 border-purple-600 dark:border-purple-400 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-1 py-0.5 w-32"
            disabled={loading}
          />
          {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
        <Button
          type="submit"
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 h-auto p-0"
        >
          {loading ? "..." : "→"}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOTP} className="flex items-center gap-2">
      <label className="text-purple-600 dark:text-purple-400 text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400">
        otp
      </label>
      <div className="flex flex-col">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={loading}
        >
          <InputOTPGroup className="gap-1">
            <InputOTPSlot
              index={0}
              className="w-4 h-5 text-xs bg-transparent border-0 border-b-2 border-purple-600 dark:border-purple-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <InputOTPSlot
              index={1}
              className="w-4 h-5 text-xs bg-transparent border-0 border-b-2 border-purple-600 dark:border-purple-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <InputOTPSlot
              index={2}
              className="w-4 h-5 text-xs bg-transparent border-0 border-b-2 border-purple-600 dark:border-purple-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <InputOTPSlot
              index={3}
              className="w-4 h-5 text-xs bg-transparent border-0 border-b-2 border-purple-600 dark:border-purple-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <InputOTPSlot
              index={4}
              className="w-4 h-5 text-xs bg-transparent border-0 border-b-2 border-purple-600 dark:border-purple-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <InputOTPSlot
              index={5}
              className="w-4 h-5 text-xs bg-transparent border-0 border-b-2 border-purple-600 dark:border-purple-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </InputOTPGroup>
        </InputOTP>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
      <Button
        type="submit"
        disabled={loading}
        variant="ghost"
        size="sm"
        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 h-auto p-0"
      >
        {loading ? "..." : "→"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setStep("email")
          setOtp("")
          setError("")
        }}
        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 h-auto p-0"
      >
        back
      </Button>
    </form>
  )
}
