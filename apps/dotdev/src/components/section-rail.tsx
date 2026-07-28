"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface RailSection {
  id: string
  label: string
}

export function SectionRail({ sections }: { sections: RailSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "")

  useEffect(() => {
    const updateActive = () => {
      const threshold = window.innerHeight * 0.35
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 8

      if (atBottom) {
        setActiveId(sections[sections.length - 1]?.id ?? "")
        return
      }

      let current = sections[0]?.id ?? ""
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element && element.getBoundingClientRect().top <= threshold) {
          current = section.id
        }
      }
      setActiveId(current)
    }

    updateActive()
    window.addEventListener("scroll", updateActive, { passive: true })
    window.addEventListener("resize", updateActive)
    return () => {
      window.removeEventListener("scroll", updateActive)
      window.removeEventListener("resize", updateActive)
    }
  }, [sections])

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (!element) {
      return
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
  }

  return (
    <nav
      aria-label="Page sections"
      className="fixed top-1/2 right-4 z-30 hidden -translate-y-1/2 lg:block xl:right-6"
    >
      <ul className="flex flex-col items-end gap-6 border-r-2 border-dotted border-border pr-5">
        {sections.map((section) => {
          const active = section.id === activeId

          return (
            <li key={section.id} className="relative flex items-center">
              <button
                type="button"
                onClick={() => scrollTo(section.id)}
                className="group flex items-center"
                aria-current={active ? "true" : undefined}
                title={section.label}
              >
                <span
                  className={cn(
                    "hidden font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 xl:inline",
                    active
                      ? "translate-x-0 text-primary opacity-100"
                      : "translate-x-1 text-muted-foreground opacity-60 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  {section.label}
                </span>
                <span
                  className={cn(
                    "absolute -right-6 size-2 rounded-full border-2 transition-all duration-300",
                    active
                      ? "scale-125 border-primary bg-primary"
                      : "border-border bg-background group-hover:border-foreground/40",
                  )}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
