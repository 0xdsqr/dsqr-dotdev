import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import styles from "./blog-post-viewer.module.css"
import { Caution, Important, MoreInfo, Note, Tip, Warning } from "./callouts"
import { CopyButton } from "./copy-button"
import { generateHeadingId } from "./on-this-page"

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
  purple: MoreInfo, // purple maps to MoreInfo
}

type CalloutType = keyof typeof calloutComponents

function processCallouts(content: string) {
  const parts: Array<{
    type: "markdown" | "callout"
    content: string
    calloutType?: CalloutType
    label?: string
  }> = []
  // Match :::type or :::type[label] followed by content and :::
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
  // Remove YAML frontmatter
  let processed = content.replace(/^---[\s\S]*?---\s*\n?/, "")
  // Remove first h1 if it exists (since BlogPostHeader shows the title)
  processed = processed.replace(/^#\s+[^\n]+\n+/, "")
  return processed.trim()
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
        {parts.map((part) => {
          if (part.type === "callout") {
            const Component = calloutComponents[part.calloutType as CalloutType]
            return (
              <Component
                key={`${part.calloutType}-${part.content.substring(0, 10)}`}
              >
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
              key={`markdown-${part.content.substring(0, 10)}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                h1: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (Array.isArray(node))
                      return node.map(extractText).join("")
                    if (node?.props?.children)
                      return extractText(node.props.children)
                    return ""
                  }
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  )
                },
                h2: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (Array.isArray(node))
                      return node.map(extractText).join("")
                    if (node?.props?.children)
                      return extractText(node.props.children)
                    return ""
                  }
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (Array.isArray(node))
                      return node.map(extractText).join("")
                    if (node?.props?.children)
                      return extractText(node.props.children)
                    return ""
                  }
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
                h4: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (Array.isArray(node))
                      return node.map(extractText).join("")
                    if (node?.props?.children)
                      return extractText(node.props.children)
                    return ""
                  }
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h4 id={id} {...props}>
                      {children}
                    </h4>
                  )
                },
                h5: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (Array.isArray(node))
                      return node.map(extractText).join("")
                    if (node?.props?.children)
                      return extractText(node.props.children)
                    return ""
                  }
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h5 id={id} {...props}>
                      {children}
                    </h5>
                  )
                },
                h6: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (Array.isArray(node))
                      return node.map(extractText).join("")
                    if (node?.props?.children)
                      return extractText(node.props.children)
                    return ""
                  }
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h6 id={id} {...props}>
                      {children}
                    </h6>
                  )
                },
                pre: ({ children, ...props }: Record<string, unknown>) => {
                  const extractText = (
                    node: Record<string, unknown>,
                  ): string => {
                    if (typeof node === "string") return node
                    if (!node) return ""
                    if (node.props?.children) {
                      if (typeof node.props.children === "string") {
                        return node.props.children
                      }
                      if (Array.isArray(node.props.children)) {
                        return node.props.children.map(extractText).join("")
                      }
                      return extractText(node.props.children)
                    }
                    return ""
                  }

                  const className = props.className || ""
                  const languageMatch = className.match(/language-(\w+)/)
                  const language = languageMatch ? languageMatch[1] : undefined

                  const codeText = extractText({ props: { children } })
                  const lineCount = codeText.trim().split("\n").length

                  return (
                    <div className={styles.codeBlockWrapper}>
                      {language && (
                        <span className={styles.codeBlockLanguage}>
                          {language}
                        </span>
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
