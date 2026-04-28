import { Effect, Layer } from "effect"
import { StorageService } from "./services/storage"

export const ApiLayer = Layer.mergeAll(StorageService.Live)

export function runApiEffect<A, E>(effect: Effect.Effect<A, E, StorageService>) {
  return Effect.runPromise(effect.pipe(Effect.provide(ApiLayer)))
}

export { Effect, Layer }
