#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

import { Console, Data, Effect } from "effect"

import definition, { infra } from "../../../haven.config.ts"

type Command = "preview" | "refresh" | "up" | "destroy" | "outputs"
type StackName = keyof typeof infra.stacks & string
type StackSpec = (typeof infra.stacks)[StackName]

class HavenCliUsageError extends Data.TaggedError("HavenCliUsageError")<{
  readonly message: string
  readonly usage?: string | undefined
}> {}

class HavenFileError extends Data.TaggedError("HavenFileError")<{
  readonly operation: "mkdir" | "writePulumiProject"
  readonly path: string
  readonly cause: unknown
  readonly message: string
}> {}

class HavenPulumiCommandError extends Data.TaggedError("HavenPulumiCommandError")<{
  readonly command: Command
  readonly stackName: string
  readonly message: string
  readonly exitCode?: number | undefined
  readonly signal?: NodeJS.Signals | undefined
  readonly cause?: unknown
}> {}

const stacks = infra.stacks
const stackGroups = infra.groups

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const shell = process.env.SHELL || "sh"

function listValues(values: Iterable<string>) {
  return [...values].join(", ")
}

const usage = `Usage:
  haven preview [--stage dev] [default|all|k8|stack...]
  haven refresh [--stage dev] [default|all|k8|stack...]
  haven up [--stage dev] [default|all|k8|stack...]
  haven destroy [--stage dev] [default|all|k8|stack...] --yes
  haven outputs [--stage dev]

Stacks:
  ${listValues(Object.keys(stacks))}

Groups:
  ${Object.entries(stackGroups)
    .map(([name, stackNames]) => `${name} = ${stackNames.join(", ")}`)
    .join("\n  ")}`

function isCommand(value: string | undefined): value is Command {
  return (
    value === "preview" ||
    value === "refresh" ||
    value === "up" ||
    value === "destroy" ||
    value === "outputs"
  )
}

function usageError(message: string, includeUsage = false) {
  return new HavenCliUsageError({
    message: includeUsage ? `${message}\n\n${usage}` : message,
    ...(includeUsage ? { usage } : undefined),
  })
}

function unique<T>(values: ReadonlyArray<T>) {
  return [...new Set(values)]
}

function parseArgsEffect(args: ReadonlyArray<string>) {
  return Effect.gen(function* () {
    let stage = "dev"
    const rest: string[] = []

    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index]

      if (arg === "--stage") {
        const value = args[index + 1]
        if (!value) {
          return yield* Effect.fail(usageError("--stage requires a value"))
        }
        stage = value
        index += 1
        continue
      }

      if (arg?.startsWith("--stage=")) {
        stage = arg.slice("--stage=".length)
        continue
      }

      if (arg) {
        rest.push(arg)
      }
    }

    return { stage, rest }
  })
}

function resolveTargetsEffect(targets: ReadonlyArray<string>) {
  return Effect.gen(function* () {
    const requested = targets.length === 0 ? ["default"] : targets
    const resolved: StackName[] = []

    for (const target of requested) {
      const group = stackGroups[target]

      if (group) {
        resolved.push(...(group as readonly StackName[]))
        continue
      }

      if (stacks[target]) {
        resolved.push(target as StackName)
        continue
      }

      return yield* Effect.fail(usageError(`Unknown stack or group "${target}".`, true))
    }

    return unique(resolved)
  })
}

function pulumiArgs(command: Command) {
  switch (command) {
    case "preview":
      return ["preview"]
    case "refresh":
      return ["refresh", "--yes"]
    case "up":
      return ["up", "--yes"]
    case "destroy":
      return ["destroy", "--yes"]
    case "outputs":
      return ["stack", "output", "--json"]
  }
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function relativePath(from: string, to: string) {
  return path.relative(from, to).replaceAll(path.sep, "/")
}

function getStackEffect(stackName: string) {
  const stack = stacks[stackName]

  return stack
    ? Effect.succeed(stack as StackSpec)
    : Effect.fail(usageError(`Unknown stack "${stackName}".`, true))
}

function pulumiProjectYaml(stack: StackSpec) {
  const projectDirectory = path.join(rootDir, stack.projectDirectory)
  const programPath = path.join(rootDir, stack.program)

  return [
    `name: ${stack.projectName}`,
    `description: ${stack.description}`,
    "runtime:",
    "  name: nodejs",
    "  options:",
    "    packagemanager: npm",
    "    typescript: true",
    `main: ${relativePath(projectDirectory, programPath)}`,
    "",
  ].join("\n")
}

function ensurePulumiProject(stackName: StackName) {
  return Effect.gen(function* () {
    const stack = yield* getStackEffect(stackName)
    const projectDirectory = path.join(rootDir, stack.projectDirectory)
    const projectPath = path.join(projectDirectory, "Pulumi.yaml")

    yield* Effect.tryPromise({
      try: () => mkdir(projectDirectory, { recursive: true }),
      catch: (cause) =>
        new HavenFileError({
          operation: "mkdir",
          path: projectDirectory,
          cause,
          message: `Unable to create Pulumi project directory for stack "${stackName}".`,
        }),
    })

    yield* Effect.tryPromise({
      try: () => writeFile(projectPath, pulumiProjectYaml(stack)),
      catch: (cause) =>
        new HavenFileError({
          operation: "writePulumiProject",
          path: projectPath,
          cause,
          message: `Unable to write Pulumi project for stack "${stackName}".`,
        }),
    })
  })
}

function commandFailedError(
  command: Command,
  stackName: StackName,
  code: number | null,
  signal: NodeJS.Signals | null,
) {
  const suffix = signal
    ? `with signal ${signal}`
    : typeof code === "number"
      ? `with exit code ${code}`
      : "without an exit code"

  return new HavenPulumiCommandError({
    command,
    stackName,
    message: `${command} ${stackName} failed ${suffix}.`,
    ...(typeof code === "number" ? { exitCode: code } : undefined),
    ...(signal ? { signal } : undefined),
  })
}

function runStack(command: Command, stackName: StackName, stage: string) {
  return Effect.gen(function* () {
    const stack = yield* getStackEffect(stackName)
    const commandLine = [
      "set -e",
      `[ -f ${shellQuote(path.join(rootDir, ".envrc.local"))} ] && . ${shellQuote(
        path.join(rootDir, ".envrc.local"),
      )}`,
      "export PULUMI_IGNORE_AMBIENT_PLUGINS=true",
      `pulumi stack select ${shellQuote(stage)} >/dev/null`,
      ["pulumi", ...pulumiArgs(command)].map(shellQuote).join(" "),
    ].join("; ")

    yield* Effect.async<void, HavenPulumiCommandError>((resume) => {
      let isSettled = false
      const settle = (effect: Effect.Effect<void, HavenPulumiCommandError>) => {
        if (!isSettled) {
          isSettled = true
          resume(effect)
        }
      }

      const child = spawn(shell, ["-c", commandLine], {
        cwd: path.join(rootDir, stack.projectDirectory),
        env: {
          ...process.env,
          PULUMI_IGNORE_AMBIENT_PLUGINS: "true",
        },
        stdio: "inherit",
      })

      child.on("error", (cause) => {
        settle(
          Effect.fail(
            new HavenPulumiCommandError({
              command,
              stackName,
              cause,
              message: `Unable to start ${command} for stack "${stackName}".`,
            }),
          ),
        )
      })

      child.on("exit", (code, signal) => {
        settle(
          code === 0
            ? Effect.void
            : Effect.fail(commandFailedError(command, stackName, code, signal)),
        )
      })
    })
  })
}

function program(argv: ReadonlyArray<string>) {
  return Effect.gen(function* () {
    const [rawCommand, ...rawRest] = argv

    if (!isCommand(rawCommand)) {
      yield* Console.log(usage)
      return
    }

    const { stage, rest } = yield* parseArgsEffect(rawRest)
    const yes = rest.includes("--yes")
    const targets = rest.filter((arg) => arg !== "--yes")

    if (rawCommand === "destroy" && !yes) {
      return yield* Effect.fail(usageError("destroy requires --yes so it is never accidental."))
    }

    const app = yield* definition.appEffect({ stage })

    if (rawCommand === "outputs") {
      yield* Console.log(JSON.stringify(yield* definition.outputsEffect({ stage }), null, 2))
      return
    }

    const selected = yield* resolveTargetsEffect(targets)

    yield* Console.log(`haven ${rawCommand}: ${app.name}/${app.stage} -> ${selected.join(", ")}`)

    for (const stackName of selected) {
      yield* Console.log(`\n==> ${rawCommand} ${stackName}`)
      yield* ensurePulumiProject(stackName)
      yield* runStack(rawCommand, stackName, stage)
    }
  })
}

Effect.runPromise(program(process.argv.slice(2))).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
