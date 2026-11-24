import { Config, Effect, Layer, Logger } from 'effect'

export const NodeEnv = Config.Literals(['development', 'production', 'test'], 'NODE_ENV').pipe(
  Config.withDefault('development'),
)

export const LoggerLive = Layer.unwrap(
  Effect.gen(function* () {
    const env = yield* NodeEnv
    return Logger.layer([env === 'production' ? Logger.consoleJson : Logger.defaultLogger])
  }),
).pipe(Layer.orDie)
