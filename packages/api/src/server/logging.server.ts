import { Config, Effect, Layer, Logger } from 'effect'

export const LoggerLive = Layer.unwrap(
  Effect.gen(function* () {
    const env = yield* Config.string('NODE_ENV').pipe(Config.withDefault('development'))
    return Logger.layer([env === 'production' ? Logger.consoleJson : Logger.defaultLogger])
  }),
).pipe(Layer.orDie)
