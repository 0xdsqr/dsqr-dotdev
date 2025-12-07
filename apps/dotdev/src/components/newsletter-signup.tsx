import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import { Button } from "@/components/ui/button.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form.js"
import { Input } from "@/components/ui/input.js"
import { useTRPC } from "@/lib/trpc"

const formSchema = z.object({
  email: z.email(),
})

function NewsletterSignup() {
  const trpc = useTRPC()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const subscribe = useMutation(
    trpc.email.subscribe.mutationOptions({
      onSuccess: async (_data) => {
        form.reset()
      },
      onError: (_err) => {},
    }),
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    subscribe.mutate({ email: values.email })
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="prose dark:prose-invert max-w-none text-center font-mono">
        <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
          I also write sometimes. Stay connected if you want.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex gap-2 w-full max-w-sm"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="m@example.com"
                    className="rounded font-mono"
                    disabled={subscribe.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="rounded font-mono"
            disabled={subscribe.isPending}
          >
            {subscribe.isPending
              ? "..."
              : subscribe.isSuccess
                ? "Subscribed!"
                : "Subscribe"}
          </Button>
        </form>
      </Form>
      {subscribe.isSuccess && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
          Thanks for subscribing!
        </p>
      )}
    </div>
  )
}

export { NewsletterSignup }
