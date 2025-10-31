"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { authClient } from "@/auth/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UserDropdown } from "./user-dropdown"

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
})

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6),
})

export function InlineSignIn() {
  const { data: session, isPending } = authClient.useSession()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  const handleSendOTP = async (values: z.infer<typeof emailSchema>) => {
    console.log("handleSendOTP called with:", values)
    setLoading(true)

    try {
      const { error: sendError } =
        await authClient.emailOtp.sendVerificationOtp({
          email: values.email,
          type: "sign-in",
        })

      if (sendError) {
        console.error("Send OTP error:", sendError)
        emailForm.setError("email", { message: "Failed to send OTP" })
        setLoading(false)
        return
      }

      console.log("OTP sent successfully, switching to OTP step")
      setEmail(values.email)
      setStep("otp")
      setLoading(false)
    } catch (error) {
      console.error("Unexpected error:", error)
      emailForm.setError("email", { message: "Failed to send OTP" })
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (values: z.infer<typeof otpSchema>) => {
    setLoading(true)

    const { error: verifyError } = await authClient.signIn.emailOtp({
      email,
      otp: values.otp,
    })

    if (verifyError) {
      otpForm.setError("otp", { message: "Invalid OTP" })
      setLoading(false)
      return
    }

    otpForm.reset({ otp: "" })
    emailForm.reset({ email: "" })
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
      <Form {...emailForm}>
        <form
          onSubmit={emailForm.handleSubmit(handleSendOTP)}
          className="flex items-center gap-2"
        >
          <label className="text-purple-600 dark:text-purple-400 text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400">
            sign in
          </label>
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input
                    type="email"
                    placeholder="email"
                    className="bg-transparent text-xs border-0 border-b-2 border-purple-600 dark:border-purple-400 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-1 py-0.5 w-32"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={loading}
            variant="ghost"
            size="sm"
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 h-auto p-0"
            onClick={() =>
              console.log("Button clicked, form values:", emailForm.getValues())
            }
          >
            {loading ? "..." : "→"}
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Form {...otpForm}>
      <form
        onSubmit={otpForm.handleSubmit(handleVerifyOTP)}
        className="flex items-center gap-2"
      >
        <span className="text-lg font-semibold">otp</span>
        <FormField
          control={otpForm.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="000000"
                  disabled={loading}
                  className="w-24 bg-transparent text-xs border-0 border-b-2 border-purple-600 dark:border-purple-400 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-1 py-0.5"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
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
            otpForm.reset({ otp: "" })
          }}
          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 h-auto p-0"
        >
          back
        </Button>
      </form>
    </Form>
  )
}
