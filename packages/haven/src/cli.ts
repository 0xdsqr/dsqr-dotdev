#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

import { Console, Effect } from "effect"

import definition, { infra } from "../../../haven.config.ts"

type Command = "preview" | "refresh" | "up" | "destroy" | "outputs"
type StackName = keyof typeof infra.stacks & string

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

function parseArgs(args: ReadonlyArray<string>) {
  let stage = "dev"
  const rest: string[] = []

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--stage") {
      const value = args[index + 1]
      if (!value) {
        throw new Error("--stage requires a value")
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
}

function unique<T>(values: ReadonlyArray<T>) {
  return [...new Set(values)]
}

function resolveTargets(targets: ReadonlyArray<string>): string[] {
  const requested = targets.length === 0 ? ["default"] : targets
  const resolved: string[] = []

  for (const target of requested) {
    const group = stackGroups[target]

    if (group) {
      resolved.push(...group)
      continue
    }

    if (stacks[target]) {
      resolved.push(target)
      continue
    }

    throw new Error(`Unknown stack or group "${target}".\n\n${usage}`)
  }

  return unique(resolved)
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

function getStack(stackName: string) {
  const stack = stacks[stackName]

  if (!stack) {
    throw new Error(`Unknown stack "${stackName}".`)
  }

  return stack
}

function pulumiProjectYaml(stackName: StackName) {
  const stack = getStack(stackName)
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
  const stack = getStack(stackName)
  const projectDirectory = path.join(rootDir, stack.projectDirectory)

  const catchFileError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

  return Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () => mkdir(projectDirectory, { recursive: true }),
      catch: catchFileError,
    })

    yield* Effect.tryPromise({
      try: () => writeFile(path.join(projectDirectory, "Pulumi.yaml"), pulumiProjectYaml(stackName)),
      catch: catchFileError,
    })
  })
}

function runStack(command: Command, stackName: StackName, stage: string) {
  const stack = getStack(stackName)
  const commandLine = [
    "set -e",
    `[ -f ${shellQuote(path.join(rootDir, ".envrc.local"))} ] && . ${shellQuote(
      path.join(rootDir, ".envrc.local"),
    )}`,
    "export PULUMI_IGNORE_AMBIENT_PLUGINS=true",
    `pulumi stack select ${shellQuote(stage)} >/dev/null`,
    ["pulumi", ...pulumiArgs(command)].map(shellQuote).join(" "),
  ].join("; ")

  return Effect.async<void, Error>((resume) => {
    const child = spawn(shell, ["-c", commandLine], {
      cwd: path.join(rootDir, stack.projectDirectory),
      env: {
        ...process.env,
        PULUMI_IGNORE_AMBIENT_PLUGINS: "true",
      },
      stdio: "inherit",
    })

    child.on("error", (error) => {
      resume(Effect.fail(error))
    })

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resume(Effect.void)
        return
      }

      resume(
        Effect.fail(
          new Error(
            `${command} ${stackName} failed${
              signal ? ` with signal ${signal}` : ` with exit code ${code}`
            }`,
          ),
        ),
      )
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

    const { stage, rest } = parseArgs(rawRest)
    const yes = rest.includes("--yes")
    const targets = rest.filter((arg) => arg !== "--yes")

    if (rawCommand === "destroy" && !yes) {
      return yield* Effect.fail(new Error("destroy requires --yes so it is never accidental."))
    }

    const app = definition.app({ stage })

    if (rawCommand === "outputs") {
      yield* Console.log(JSON.stringify(definition.outputs({ stage }), null, 2))
      return
    }

    const selected = resolveTargets(targets)

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
