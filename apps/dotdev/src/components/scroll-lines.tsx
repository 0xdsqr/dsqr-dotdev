"use client"

import { useEffect, useRef } from "react"

export function ScrollLines() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const scrollY = window.scrollY
      const lines = containerRef.current.querySelectorAll(".scroll-line")

      lines.forEach((line, index) => {
        const element = line as HTMLElement
        const speed = 0.05 + index * 0.02
        const offset = scrollY * speed
        const direction = index % 2 === 0 ? 1 : -1
        element.style.transform = `translateY(${offset * direction}px)`
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Vertical lines */}
      <div className="scroll-line absolute left-[10%] top-0 w-px h-[200vh] bg-gradient-to-b from-transparent via-border/30 to-transparent" />
      <div className="scroll-line absolute left-[25%] top-0 w-px h-[250vh] bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      <div className="scroll-line absolute right-[20%] top-0 w-px h-[180vh] bg-gradient-to-b from-transparent via-border/20 to-transparent" />
      <div className="scroll-line absolute right-[8%] top-0 w-px h-[220vh] bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      {/* Decorative dots */}
      <div className="scroll-line absolute left-[10%] top-[30%] w-1 h-1 rounded-full bg-primary/20" />
      <div className="scroll-line absolute left-[25%] top-[50%] w-1.5 h-1.5 rounded-full bg-primary/15" />
      <div className="scroll-line absolute right-[20%] top-[40%] w-1 h-1 rounded-full bg-border" />
    </div>
  )
}
