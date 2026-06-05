import { createOtelLayerFromEnv } from "@dsqr-dotdev/observability/effect-otel"
import { Effect, Layer } from "effect"
import { ManagedRuntime } from "effect"
import { StorageService } from "./services/storage"

export const ApiLayer = Layer.mergeAll(
  createOtelLayerFromEnv("dsqr-dotdev-api"),
  StorageService.Live,
)

const sharedMemoMap = Effect.runSync(Layer.makeMemoMap)
const apiRuntime = ManagedRuntime.make(ApiLayer, sharedMemoMap)

export function runApiEffect<A, E>(effect: Effect.Effect<A, E, StorageService>) {
  return apiRuntime.runPromise(effect)
}

export function traceApiRequest<A>(name: string, request: Request, handler: () => Promise<A>) {
  return runApiEffect(
    // tryPromise (not promise) so a rejected handler becomes a typed failure and
    // the span is recorded with error status instead of being swallowed as a defect.
    Effect.tryPromise({ try: handler, catch: (cause) => cause }).pipe(
      Effect.withSpan(name, {
        attributes: {
          "http.method": request.method,
          "url.path": new URL(request.url).pathname,
        },
      }),
    ),
  )
}

export { Effect, Layer }
