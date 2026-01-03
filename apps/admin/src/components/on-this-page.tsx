"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

export interface Heading {
  id: string
  text: string
  level: number // 1-6 (h1-h6)
}

interface OnThisPageProps {
  headings: Heading[]
  className?: string
}

export function OnThisPage({ headings, className }: OnThisPageProps) {
  const [activeHeading, setActiveHeading] = useState<string>("")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const navRef = useRef<HTMLUListElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  useEffect(() => {
    if (activeHeading === "" && headings.length > 0) {
      setActiveHeading(headings[0].id)
    }
  }, [headings, activeHeading])

  useEffect(() => {
    const headingElements = new Map<string, Element>()

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        headingElements.set(id, element)
      }
    })

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-20% 0% -60% 0%",
      },
    )

    headingElements.forEach((element) => {
      observerRef.current?.observe(element)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [headings])

  const handleNavigate = (
    id: string,
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault()
    const findAndScroll = () => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
        setActiveHeading(id)
      } else {
        setTimeout(() => {
          const retryElement = document.getElementById(id)
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: "smooth", block: "start" })
            setActiveHeading(id)
          }
        }, 50)
      }
    }
    findAndScroll()
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <aside className={`w-64 ${className || ""}`}>
      <nav className="relative">
        {activeHeading && (
          <div
            className="absolute transition-all duration-300 ease-out"
            style={{
              top: `${headings.findIndex((h) => h.id === activeHeading) * 40 + 14}px`,
              left: "-6px",
              width: "8px",
              height: "8px",
              background: "hsl(var(--primary))",
              borderRadius: "50%",
              boxShadow: "0 0 0 3px hsl(var(--primary) / 0.2)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          >
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
            `}</style>
          </div>
        )}

        <ul ref={navRef} className="flex flex-col gap-0 list-none m-0 pl-8">
          {headings.map((heading) => {
            const isActive = activeHeading === heading.id
            const indent = Math.max(heading.level - 2, 0) * 16

            return (
              <li key={heading.id} style={{ height: "40px" }}>
                <a
                  ref={(el) => {
                    if (el) {
                      linkRefs.current.set(heading.id, el)
                    }
                  }}
                  href={`#${heading.id}`}
                  onClick={(e) => handleNavigate(heading.id, e)}
                  className={`
                    inline-flex items-center h-full text-sm leading-relaxed
                    transition-all duration-200
                    ${
                      isActive
                        ? "text-purple-600 dark:text-purple-400 font-medium underline decoration-dotted decoration-purple-600 dark:decoration-purple-400 underline-offset-2"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                  style={{
                    paddingLeft: `${indent}px`,
                  }}
                  title={heading.text}
                >
                  {heading.text}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export function extractHeadingsFromMarkdown(content: string): Heading[] {
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "")

  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Heading[] = []
  let execMatch: RegExpExecArray | null = headingRegex.exec(
    contentWithoutCodeBlocks,
  )

  while (execMatch !== null) {
    const match = execMatch
    const level = match[1].length
    const text = match[2].trim()
    const id = generateHeadingId(text)

    headings.push({ id, text, level })
    execMatch = headingRegex.exec(contentWithoutCodeBlocks)
  }

  return headings
}

export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.\-/]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-$/g, "")
}

export function useHeadings(content: string) {
  return extractHeadingsFromMarkdown(content)
}
