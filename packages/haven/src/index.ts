import { readdirSync } from "node:fs"
import * as path from "node:path"

import { Cause, Data, Effect, Exit } from "effect"

export type StackSpec = {
  readonly name: string
  readonly projectName: string
  readonly description: string
  readonly projectDirectory: string
  readonly program: string
}

export type StackProjectSpec = {
  readonly projectName?: string | undefined
  readonly description: string
}

export type InfraStackDefinition = {
  readonly stacks: Readonly<Record<string, StackSpec>>
  readonly groups: Readonly<Record<string, readonly string[]>>
}

export type StacksArgs = {
  readonly rootDirectory?: string | undefined
  readonly directory?: string | undefined
  readonly projectDirectory?: string | undefined
  readonly projects: Readonly<Record<string, StackProjectSpec>>
  readonly groups: Readonly<Record<string, readonly string[]>>
  readonly ignore?: ReadonlyArray<string> | undefined
}

export class HavenStackDiscoveryError extends Data.TaggedError("HavenStackDiscoveryError")<{
  readonly directory: string
  readonly cause: unknown
  readonly message: string
}> {}

export class HavenStackConfigError extends Data.TaggedError("HavenStackConfigError")<{
  readonly message: string
}> {}

const defaultIgnoredPrograms = new Set(["config"])

function discoverPrograms(directory: string, ignore: ReadonlyArray<string>) {
  const ignored = new Set([...defaultIgnoredPrograms, ...ignore])

  return Effect.try({
    try: () => readdirSync(directory, { withFileTypes: true }),
    catch: (cause) =>
      new HavenStackDiscoveryError({
        directory,
        cause,
        message: `Unable to discover Haven stack programs in ${directory}.`,
      }),
  }).pipe(
    Effect.map((entries) =>
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
        .map((entry) => path.basename(entry.name, ".ts"))
        .filter((name) => !ignored.has(name))
        .sort(),
    ),
  )
}

function failStackConfig(message: string) {
  return Effect.fail(new HavenStackConfigError({ message }))
}

function runSyncOrThrow<A, E>(effect: Effect.Effect<A, E, never>): A {
  const exit = Effect.runSyncExit(effect)

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  throw Cause.squash(exit.cause)
}

export function $stacksEffect(
  args: StacksArgs,
): Effect.Effect<InfraStackDefinition, HavenStackDiscoveryError | HavenStackConfigError> {
  const rootDirectory = args.rootDirectory ?? process.cwd()
  const directory = args.directory ?? "infra"
  const absoluteDirectory = path.join(rootDirectory, directory)
  const projectDirectory = args.projectDirectory ?? ".haven/pulumi"

  return Effect.gen(function* () {
    const programs = yield* discoverPrograms(absoluteDirectory, args.ignore ?? [])

    for (const name of Object.keys(args.projects)) {
      if (!programs.includes(name)) {
        return yield* failStackConfig(
          `Stack "${name}" is configured but ${directory}/${name}.ts was not found.`,
        )
      }
    }

    for (const name of programs) {
      if (!args.projects[name]) {
        return yield* failStackConfig(
          `Found ${directory}/${name}.ts but no stack metadata was configured for "${name}".`,
        )
      }
    }

    const stackEntries = yield* Effect.forEach(programs, (name) => {
      const project = args.projects[name]

      return project
        ? Effect.succeed([
            name,
            {
              name,
              projectName: project.projectName ?? name,
              description: project.description,
              projectDirectory: `${projectDirectory}/${name}`,
              program: `${directory}/${name}.ts`,
            },
          ] as const)
        : failStackConfig(`Missing project metadata for "${name}".`)
    })
    const stacks = Object.fromEntries(stackEntries)

    for (const [groupName, stackNames] of Object.entries(args.groups)) {
      for (const stackName of stackNames) {
        if (!stacks[stackName]) {
          return yield* failStackConfig(
            `Group "${groupName}" references unknown stack "${stackName}".`,
          )
        }
      }
    }

    return {
      stacks,
      groups: args.groups,
    } as const satisfies InfraStackDefinition
  })
}

export function $stacks(args: StacksArgs) {
  return runSyncOrThrow($stacksEffect(args))
}
