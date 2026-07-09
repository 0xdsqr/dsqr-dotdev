import { Cause, Effect, Exit } from "effect"

export type HomelabDefinitionInput = {
  readonly stage?: string | undefined
}

export type MaybeEffect<A> = A | Effect.Effect<A, unknown, never>

export type HomelabDefinitionSource<App, Infra, Outputs> = {
  readonly app: (input: HomelabDefinitionInput) => MaybeEffect<App>
  readonly run: (input: HomelabDefinitionInput) => MaybeEffect<Infra>
  readonly outputs?: (input: HomelabDefinitionInput, infra: Infra) => MaybeEffect<Outputs>
}

export type HomelabDefinition<App, Infra, Outputs> = {
  readonly app: (input?: HomelabDefinitionInput | undefined) => App
  readonly appEffect: (
    input?: HomelabDefinitionInput | undefined,
  ) => Effect.Effect<App, unknown, never>
  readonly run: (input?: HomelabDefinitionInput | undefined) => Infra
  readonly runEffect: (
    input?: HomelabDefinitionInput | undefined,
  ) => Effect.Effect<Infra, unknown, never>
  readonly outputs: (input?: HomelabDefinitionInput | undefined) => Outputs
  readonly outputsEffect: (
    input?: HomelabDefinitionInput | undefined,
  ) => Effect.Effect<Outputs, unknown, never>
}

export function $definition<const App, const Infra, const Outputs = Infra>(source: {
  readonly app: (input: HomelabDefinitionInput) => MaybeEffect<App>
  readonly run: (input: HomelabDefinitionInput) => Effect.Effect<Infra, any, any>
  readonly outputs?: (input: HomelabDefinitionInput, infra: Infra) => MaybeEffect<Outputs>
}): HomelabDefinition<App, Infra, Outputs>
export function $definition<const App, const Infra, const Outputs = Infra>(source: {
  readonly app: (input: HomelabDefinitionInput) => MaybeEffect<App>
  readonly run: (input: HomelabDefinitionInput) => Infra
  readonly outputs?: (input: HomelabDefinitionInput, infra: Infra) => MaybeEffect<Outputs>
}): HomelabDefinition<App, Infra, Outputs>
export function $definition<const App, const Infra, const Outputs = Infra>(
  source: HomelabDefinitionSource<App, Infra, Outputs>,
): HomelabDefinition<App, Infra, Outputs> {
  function intoEffect<A>(value: MaybeEffect<A>) {
    return Effect.isEffect(value)
      ? (value as Effect.Effect<A, unknown, never>)
      : Effect.succeed(value)
  }

  function runSyncOrThrow<A, E>(effect: Effect.Effect<A, E, never>): A {
    const exit = Effect.runSyncExit(effect)

    if (Exit.isSuccess(exit)) {
      return exit.value
    }

    throw Cause.squash(exit.cause)
  }

  const definition: HomelabDefinition<App, Infra, Outputs> = {
    app(input) {
      return runSyncOrThrow(definition.appEffect(input))
    },
    appEffect(input = {}) {
      return intoEffect(source.app(input))
    },
    run(input) {
      return runSyncOrThrow(definition.runEffect(input))
    },
    runEffect(input = {}) {
      return intoEffect(source.run(input))
    },
    outputs(input) {
      return runSyncOrThrow(definition.outputsEffect(input))
    },
    outputsEffect(input = {}) {
      return Effect.gen(function* () {
        const infra = yield* definition.runEffect(input)
        return yield* intoEffect(
          source.outputs ? source.outputs(input, infra) : (infra as unknown as Outputs),
        )
      })
    },
  }

  return definition
}

export { Effect }
