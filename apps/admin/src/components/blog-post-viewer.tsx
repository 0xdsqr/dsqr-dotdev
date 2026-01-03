import type { ReactNode } from "react"
import { useMemo } from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import styles from "./blog-post-viewer.module.css"
import { Caution, Important, MoreInfo, Note, Tip, Warning } from "./callouts"
import { CopyButton } from "./copy-button"

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

function extractTextFromNode(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractTextFromNode).join("")
  if (typeof node === "object" && "props" in node) {
    return extractTextFromNode(
      (node as { props?: { children?: ReactNode } }).props?.children,
    )
  }
  return ""
}

function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const markdownComponents: Components = {
  h1: ({ children, ...props }) => {
    const text = extractTextFromNode(children)
    const id = generateHeadingId(text)
    return (
      <h1 id={id} {...props}>
        {children}
      </h1>
    )
  },
  h2: ({ children, ...props }) => {
    const text = extractTextFromNode(children)
    const id = generateHeadingId(text)
    return (
      <h2 id={id} {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }) => {
    const text = extractTextFromNode(children)
    const id = generateHeadingId(text)
    return (
      <h3 id={id} {...props}>
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }) => {
    const text = extractTextFromNode(children)
    const id = generateHeadingId(text)
    return (
      <h4 id={id} {...props}>
        {children}
      </h4>
    )
  },
  h5: ({ children, ...props }) => {
    const text = extractTextFromNode(children)
    const id = generateHeadingId(text)
    return (
      <h5 id={id} {...props}>
        {children}
      </h5>
    )
  },
  h6: ({ children, ...props }) => {
    const text = extractTextFromNode(children)
    const id = generateHeadingId(text)
    return (
      <h6 id={id} {...props}>
        {children}
      </h6>
    )
  },
  pre: ({ children, className, ...props }) => {
    const codeText = extractTextFromNode(children)
    const languageMatch = (className as string)?.match(/language-(\w+)/)
    const language = languageMatch ? languageMatch[1] : undefined
    const lineCount = codeText.trim().split("\n").length

    return (
      <div className={styles.codeBlockWrapper}>
        {language && (
          <span className={styles.codeBlockLanguage}>{language}</span>
        )}
        {codeText && <CopyButton value={codeText} />}
        <div className={styles.codeBlockContainer}>
          <pre className={styles.codeBlockLines}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className={styles.codeLineNumber}>
                {i + 1}
              </div>
            ))}
          </pre>
          <pre {...props} className={styles.codeBlockPre}>
            {children}
          </pre>
        </div>
      </div>
    )
  },
}

export function BlogPostViewer({ content }: BlogPostViewerProps) {
  const processedContent = useMemo(
    () => stripFrontmatterAndTitle(content),
    [content],
  )
  const parts = useMemo(
    () => processCallouts(processedContent),
    [processedContent],
  )

  return (
    <article className="w-full font-sans">
      <div className={`${styles.prose} max-w-none space-y-6`}>
        {parts.map((part, index) => {
          if (part.type === "callout") {
            const Component = calloutComponents[part.calloutType as CalloutType]
            return (
              <Component key={`callout-${index}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {part.content}
                </ReactMarkdown>
              </Component>
            )
          }

          return (
            <ReactMarkdown
              key={`markdown-${index}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={markdownComponents}
            >
              {part.content}
            </ReactMarkdown>
          )
        })}
      </div>
    </article>
  )
}
