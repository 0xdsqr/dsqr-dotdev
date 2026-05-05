import { readdirSync } from "node:fs"
import * as path from "node:path"

import { Effect, pipe } from "effect"

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

const defaultIgnoredPrograms = new Set(["config"])

function discoverPrograms(directory: string, ignore: ReadonlyArray<string>) {
  const ignored = new Set([...defaultIgnoredPrograms, ...ignore])

  return pipe(
    Effect.try({
      try: () => readdirSync(directory, { withFileTypes: true }),
      catch: (error) => (error instanceof Error ? error : new Error(String(error))),
    }),
    Effect.map((entries) =>
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
        .map((entry) => path.basename(entry.name, ".ts"))
        .filter((name) => !ignored.has(name))
        .sort(),
    ),
  )
}

export function $stacks(args: StacksArgs) {
  const rootDirectory = args.rootDirectory ?? process.cwd()
  const directory = args.directory ?? "infra"
  const absoluteDirectory = path.join(rootDirectory, directory)
  const projectDirectory = args.projectDirectory ?? ".haven/pulumi"

  return Effect.runSync(
    Effect.gen(function* () {
      const programs = yield* discoverPrograms(absoluteDirectory, args.ignore ?? [])

      for (const name of Object.keys(args.projects)) {
        if (!programs.includes(name)) {
          return yield* Effect.fail(
            new Error(`Stack "${name}" is configured but ${directory}/${name}.ts was not found.`),
          )
        }
      }

      for (const name of programs) {
        if (!args.projects[name]) {
          return yield* Effect.fail(
            new Error(
              `Found ${directory}/${name}.ts but no stack metadata was configured for "${name}".`,
            ),
          )
        }
      }

      const stacks = Object.fromEntries(
        programs.map((name) => {
          const project = args.projects[name]

          if (!project) {
            throw new Error(`Missing project metadata for "${name}".`)
          }

          return [
            name,
            {
              name,
              projectName: project.projectName ?? name,
              description: project.description,
              projectDirectory: `${projectDirectory}/${name}`,
              program: `${directory}/${name}.ts`,
            },
          ]
        }),
      )

      for (const [groupName, stackNames] of Object.entries(args.groups)) {
        for (const stackName of stackNames) {
          if (!stacks[stackName]) {
            return yield* Effect.fail(
              new Error(`Group "${groupName}" references unknown stack "${stackName}".`),
            )
          }
        }
      }

      return {
        stacks,
        groups: args.groups,
      } as const satisfies InfraStackDefinition
    }),
  )
}
