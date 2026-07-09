import { Cause, Data, Effect, Exit } from "effect"

export type PulumiConfigReader<Secret = unknown> = {
  get(name: string): string | undefined
  getBoolean(name: string): boolean | undefined
  getSecret(name: string): Secret | undefined
}

export class MissingPulumiConfigError extends Data.TaggedError("MissingPulumiConfigError")<{
  readonly field: string
  readonly expected: ReadonlyArray<string>
}> {}

export class PulumiResourceConfigError extends Data.TaggedError("PulumiResourceConfigError")<{
  readonly resource: string
  readonly message: string
}> {}

export type ResourceOptions = {
  readonly parent?: unknown
  readonly provider?: unknown
  readonly dependsOn?: unknown
}

export type Transform<Args extends object, Options extends object = ResourceOptions> =
  | Partial<Args>
  | ((args: Args, options: Options, name: string) => void | undefined)

export function firstDefined(...values: ReadonlyArray<string | undefined>) {
  return values.find((value) => value !== undefined && value.length > 0)
}

export function hasValue<T>(value: T | undefined): value is T {
  return value !== undefined && value !== ""
}

export function requireConfigValueEffect<T>(
  value: T | undefined,
  field: string,
  expected: ReadonlyArray<string>,
): Effect.Effect<T, MissingPulumiConfigError> {
  return hasValue(value)
    ? Effect.succeed(value)
    : Effect.fail(new MissingPulumiConfigError({ field, expected }))
}

export function requireResourceConfigEffect(
  condition: boolean,
  resource: string,
  message: string,
): Effect.Effect<void, PulumiResourceConfigError> {
  return condition ? Effect.void : Effect.fail(new PulumiResourceConfigError({ resource, message }))
}

export function requireConfigValue<T>(
  value: T | undefined,
  field: string,
  expected: ReadonlyArray<string>,
) {
  if (hasValue(value)) {
    return value
  }

  throw new MissingPulumiConfigError({ field, expected })
}

export function runSyncOrThrow<A, E>(effect: Effect.Effect<A, E, never>): A {
  const exit = Effect.runSyncExit(effect)

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  throw Cause.squash(exit.cause)
}

export function transformResourceArgs<
  Args extends object,
  Options extends object = ResourceOptions,
>(transform: Transform<Args, Options> | undefined, name: string, args: Args, options: Options) {
  if (typeof transform === "function") {
    transform(args, options, name)
    return [name, args, options] as const
  }

  return [name, { ...args, ...transform }, options] as const
}

export { Cause, Data, Effect, Exit }
