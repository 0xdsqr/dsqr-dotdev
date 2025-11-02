import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { Caution, Important, MoreInfo, Note, Tip, Warning } from "./callouts"
import { CopyButton } from "./copy-button"
import "./blog-post-viewer.css"

interface BlogPostViewerProps {
  content: string
}

// Map callout types to components
const calloutComponents = {
  Important,
  Note,
  Tip,
  Warning,
  Caution,
  MoreInfo,
}

type CalloutType = keyof typeof calloutComponents

// Split content by callout tags and return mixed content
function processCallouts(content: string) {
  const parts: Array<{
    type: "markdown" | "callout"
    content: string
    calloutType?: CalloutType
  }> = []
  const calloutRegex =
    /<(Important|Note|Tip|Warning|Caution|MoreInfo)>([\s\S]*?)<\/\1>/g

  let lastIndex = 0
  let match

  while ((match = calloutRegex.exec(content)) !== null) {
    // Add markdown before callout
    if (match.index > lastIndex) {
      parts.push({
        type: "markdown",
        content: content.slice(lastIndex, match.index),
      })
    }

    // Add callout
    parts.push({
      type: "callout",
      content: match[2],
      calloutType: match[1] as CalloutType,
    })

    lastIndex = calloutRegex.lastIndex
  }

  // Add remaining markdown
  if (lastIndex < content.length) {
    parts.push({
      type: "markdown",
      content: content.slice(lastIndex),
    })
  }

  return parts.length > 0 ? parts : [{ type: "markdown" as const, content }]
}

export function BlogPostViewer({ content }: BlogPostViewerProps) {
  const parts = useMemo(() => processCallouts(content), [content])

  return (
    <article className="w-full font-sans">
      <div className="prose max-w-none space-y-6">
        {parts.map((part, idx) => {
          if (part.type === "callout") {
            const Component = calloutComponents[part.calloutType!]
            return (
              <Component key={idx}>
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
              key={idx}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                pre: ({ children, ...props }: any) => {
                  // Extract plain text code from the rendered HTML
                  const extractText = (node: any): string => {
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

                  // Extract language from className
                  const className = props.className || ""
                  const languageMatch = className.match(/language-(\w+)/)
                  const language = languageMatch ? languageMatch[1] : undefined

                  const codeText = extractText({ props: { children } })
                  const lineCount = codeText.split("\n").length

                  return (
                    <div className="code-block-wrapper">
                      {language && (
                        <span className="code-block-language">{language}</span>
                      )}
                      {codeText && <CopyButton value={codeText} />}
                      <div className="code-block-container">
                        <pre className="code-block-lines">
                          {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i} className="code-line-number">
                              {i + 1}
                            </div>
                          ))}
                        </pre>
                        <pre {...props} className="code-block-pre">
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
