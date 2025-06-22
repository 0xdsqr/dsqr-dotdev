import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { CheckIcon, Loader2Icon } from 'lucide-react'

// Newsletter subscription schema using Zod
const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
})

type NewsletterFormValues = z.infer<typeof newsletterSchema>

// Simulated API call
async function subscribeToNewsletter(email: string) {
  // Log the email for now
  console.log(`Email submitted: ${email}`)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return { success: true, message: "Feature coming soon" }
}

export function Newsletter() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

  // Initialize the form with Zod validation
  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange", // Enable validation on change
  })

  // Get form state
  const { formState, watch } = form
  const emailValue = watch("email")
  const isEmailEmpty = !emailValue
  const isEmailValid = !formState.errors.email && emailValue

  async function onSubmit(data: NewsletterFormValues) {
    if (!isEmailValid) return
    
    try {
      setStatus("loading")
      
      // Log the email to console
      const result = await subscribeToNewsletter(data.email)
      
      if (result.success) {
        setStatus("success")
        form.reset()
      } else {
        throw new Error("Failed to subscribe")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      form.setError("email", { 
        type: "server", 
        message: "Something went wrong. Please try again." 
      })
      setStatus("idle")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="w-16 h-16 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted">
        <img
          src="/me-ghibli.png"
          alt="0xdsqr"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="prose dark:prose-invert max-w-none text-center">
        <p className="text-sm sm:text-base leading-relaxed">
          Dad of one. Interested in{" "}
          <span className="text-teal-600 dark:text-teal-400 border-b-2 border-dotted border-teal-600 dark:border-teal-400">
            servers/
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-dotted border-indigo-600 dark:border-indigo-400">
            (less)
          </span>
          , developer workflows, and{" "}
          <span className="italic border-b-2 border-dotted border-orange-400 text-orange-600 dark:text-orange-300">
            &quot;the cloud&quot;
          </span>
          .{" "}
          <Link
            to="/about"
            className="italic border-b-2 border-dotted border-purple-500 text-purple-500 dark:text-purple-400 font-medium"
          >
            More About Me
          </Link>
        </p>
        <p className="mt-4 text-sm sm:text-base">I also write sometimes. Stay connected if you want.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md px-4" autoComplete="off">
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        className="bg-background border-border"
                        disabled={status === "loading" || status === "success"}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                size="default"
                className="px-4 flex items-center justify-center newsletter-button bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
                disabled={isEmailEmpty || !isEmailValid}
              >
              {status === "loading" ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin mr-1" />
                  <span>Loading...</span>
                </>
              ) : status === "success" ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  <span>Done</span>
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
            </div>
            
            <div className="px-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormMessage className="text-xs text-red-500" />
                )}
              />
              
              {status === "success" && (
                <p className="text-sm text-purple-500">Feature coming soon!</p>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}