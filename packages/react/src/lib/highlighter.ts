import { createHighlighterCoreSync, type HighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"
import bash from "@shikijs/langs/bash"
import css from "@shikijs/langs/css"
import diff from "@shikijs/langs/diff"
import docker from "@shikijs/langs/docker"
import go from "@shikijs/langs/go"
import hcl from "@shikijs/langs/hcl"
import html from "@shikijs/langs/html"
import json from "@shikijs/langs/json"
import markdown from "@shikijs/langs/markdown"
import nix from "@shikijs/langs/nix"
import python from "@shikijs/langs/python"
import rust from "@shikijs/langs/rust"
import sql from "@shikijs/langs/sql"
import toml from "@shikijs/langs/toml"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import yaml from "@shikijs/langs/yaml"

// react-markdown renders synchronously (runSync), so the async Shiki highlighter
// cannot be used. We build a sync core highlighter once at module load with a
// curated language set + the JS regex engine (no wasm), and reuse it for every
// code block — this is effectively our highlight cache.
const themes = [githubLight, githubDark]
const langs = [
  typescript,
  tsx,
  json,
  bash,
  nix,
  go,
  rust,
  python,
  yaml,
  toml,
  sql,
  hcl,
  docker,
  diff,
  markdown,
  html,
  css,
]

let highlighter: HighlighterCore | null = null

function getHighlighter(): HighlighterCore {
  if (!highlighter) {
    highlighter = createHighlighterCoreSync({
      themes,
      langs,
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighter
}

// A few friendly aliases onto the loaded grammars.
const languageAliases: Record<string, string> = {
  js: "typescript",
  jsx: "tsx",
  ts: "typescript",
  mjs: "typescript",
  cjs: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  dockerfile: "docker",
  terraform: "hcl",
  tf: "hcl",
  md: "markdown",
  mdx: "markdown",
  htm: "html",
}

function resolveLanguage(lang: string | undefined): string {
  if (!lang) {
    return "text"
  }
  const normalized = lang.toLowerCase()
  const resolved = languageAliases[normalized] ?? normalized
  return getHighlighter().getLoadedLanguages().includes(resolved) ? resolved : "text"
}

// Emits dual-theme HTML (defaultColor: false → both themes as CSS variables) so
// the .dark variant can swap palettes via CSS instead of re-highlighting.
export function highlightToHtml(code: string, lang: string | undefined): string {
  const language = resolveLanguage(lang)
  return getHighlighter().codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })
}
