import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod/v4"
import { trpc } from "@/router.js"
import { Button } from "@/components/ui/button.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form.js"
import { Input } from "@/components/ui/input.js"

const formSchema = z.object({
  email: z.email(),
})

function NewsletterSignup() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const queryClient = useQueryClient()
  const createEmail = useMutation(
    trpc.email.create.mutationOptions({
      onSuccess: async (data) => {
        console.log("Newsletter signup success:", data)
        form.reset()
        await queryClient.invalidateQueries(trpc.email.pathFilter())
      },
      onError: (err) => {
        console.error("Newsletter signup error:", err)
      },
    }),
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    createEmail.mutate({ email: values.email })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      className="rounded font-mono flex-1"
                      {...field}
                    />
                  </FormControl>
                  <Button type="submit" className="rounded font-mono">
                    Subscribe
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}

export { NewsletterSignup }
