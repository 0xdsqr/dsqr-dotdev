import type { ReactNode } from "react"
import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { highlightToHtml } from "../lib/highlighter"
import styles from "./blog-post-viewer.module.css"
import { Caution, Important, MoreInfo, Note, Tip, Warning } from "./callouts"
import { CopyButton } from "./copy-button"
import { generateHeadingId } from "./on-this-page"

type MdProps = { children?: ReactNode; [key: string]: any }

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "details", "summary"],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ["className", /^language-[\w-]+$/]],
    span: [...(defaultSchema.attributes?.span || []), ["className", /^hljs[\w -]*$/]],
    div: [...(defaultSchema.attributes?.div || []), ["className", /^[\w -]+$/]],
    img: [
      ...(defaultSchema.attributes?.img || []),
      "loading",
      "decoding",
      "src",
      "alt",
      "title",
      "width",
      "height",
    ],
  },
}

interface BlogPostViewerProps {
  content: string
}

const calloutComponents = {
  important: Important,
  note: Note,
  tip: Tip,
  warning: Warning,
  caution: Caution,
  moreinfo: MoreInfo,
  purple: MoreInfo,
}

type CalloutType = keyof typeof calloutComponents

function processCallouts(content: string) {
  const parts: Array<{
    type: "markdown" | "callout"
    content: string
    calloutType?: CalloutType
    label?: string
  }> = []
  const calloutRegex =
    /^:::(note|tip|warning|important|caution|moreinfo|purple)(?:\[([^\]]*)\])?\s*\n([\s\S]*?)^:::/gm

  let lastIndex = 0
  let execMatch: RegExpExecArray | null = calloutRegex.exec(content)
  while (execMatch !== null) {
    const match = execMatch
    if (match.index > lastIndex) {
      parts.push({
        type: "markdown",
        content: content.slice(lastIndex, match.index),
      })
    }

    parts.push({
      type: "callout",
      content: match[3].trim(),
      calloutType: match[1].toLowerCase() as CalloutType,
      label: match[2],
    })

    lastIndex = calloutRegex.lastIndex
    execMatch = calloutRegex.exec(content)
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "markdown",
      content: content.slice(lastIndex),
    })
  }

  return parts.length > 0 ? parts : [{ type: "markdown" as const, content }]
}

function stripFrontmatterAndTitle(content: string): string {
  let processed = content.replace(/^---[\s\S]*?---\s*\n?/, "")
  processed = processed.replace(/^#\s+[^\n]+\n+/, "")
  return processed.trim()
}

export function BlogPostViewer({ content }: BlogPostViewerProps) {
  const processedContent = useMemo(() => stripFrontmatterAndTitle(content), [content])
  const parts = useMemo(() => processCallouts(processedContent), [processedContent])

  return (
    <article className="w-full font-sans">
      <div className={`${styles.prose} max-w-none space-y-6`}>
        {parts.map((part) => {
          if (part.type === "callout") {
            const Component = calloutComponents[part.calloutType as CalloutType]
            return (
              <Component key={`${part.calloutType}-${part.content.substring(0, 10)}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: CodeBlock }}>
                  {part.content}
                </ReactMarkdown>
              </Component>
            )
          }

          return (
            <ReactMarkdown
              key={`markdown-${part.content.substring(0, 10)}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
              components={{
                h1: ({ children, ...props }: MdProps) => {
                  const text = extractHeadingText(children as MdProps)
                  const id = generateHeadingId(text)
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  )
                },
                h2: ({ children, ...props }: MdProps) => {
                  const text = extractHeadingText(children as MdProps)
                  const id = generateHeadingId(text)
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ children, ...props }: MdProps) => {
                  const text = extractHeadingText(children as MdProps)
                  const id = generateHeadingId(text)
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
                h4: ({ children, ...props }: MdProps) => {
                  const text = extractHeadingText(children as MdProps)
                  const id = generateHeadingId(text)
                  return (
                    <h4 id={id} {...props}>
                      {children}
                    </h4>
                  )
                },
                h5: ({ children, ...props }: MdProps) => {
                  const text = extractHeadingText(children as MdProps)
                  const id = generateHeadingId(text)
                  return (
                    <h5 id={id} {...props}>
                      {children}
                    </h5>
                  )
                },
                h6: ({ children, ...props }: MdProps) => {
                  const text = extractHeadingText(children as MdProps)
                  const id = generateHeadingId(text)
                  return (
                    <h6 id={id} {...props}>
                      {children}
                    </h6>
                  )
                },
                pre: CodeBlock,
                img: ({ alt, src, ...props }: MdProps) => (
                  <img
                    alt={typeof alt === "string" ? alt : ""}
                    src={typeof src === "string" ? src : ""}
                    loading="lazy"
                    decoding="async"
                    className="my-8 w-full overflow-hidden rounded-xl border border-border object-cover"
                    {...props}
                  />
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          )
        })}
      </div>
    </article>
  )
}

function getCodeBlockMeta(children: ReactNode): { code: string; language?: string } {
  const child = Array.isArray(children) ? children[0] : children
  const className =
    child && typeof child === "object" && "props" in child
      ? ((child as { props?: { className?: string } }).props?.className ?? "")
      : ""
  const languageMatch = className.match(/language-([\w-]+)/)
  const code = extractCodeText({ props: { children } } as MdProps).replace(/\n$/, "")
  return { code, language: languageMatch?.[1] }
}

// Renders a fenced code block with Shiki (dual github themes, server-safe sync
// highlighter) inside the existing toolbar/card shell. Shiki escapes the code, so
// the injected HTML is safe.
function CodeBlock({ children }: MdProps) {
  const { code, language } = getCodeBlockMeta(children)
  if (!code) {
    return null
  }

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeBlockToolbar}>
        {language && <span className={styles.codeBlockLanguage}>{language}</span>}
        <CopyButton value={code} />
      </div>
      <div
        className={styles.codeBlockShiki}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output, code is escaped
        dangerouslySetInnerHTML={{ __html: highlightToHtml(code, language) }}
      />
    </div>
  )
}

function extractHeadingText(node: MdProps): string {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(extractHeadingText).join("")
  if (node?.props?.children) return extractHeadingText(node.props.children)
  return ""
}

function extractCodeText(node: MdProps): string {
  if (typeof node === "string") return node
  if (!node) return ""
  if (node.props?.children) {
    if (typeof node.props.children === "string") {
      return node.props.children
    }
    if (Array.isArray(node.props.children)) {
      return node.props.children.map(extractCodeText).join("")
    }
    return extractCodeText(node.props.children)
  }
  return ""
}
