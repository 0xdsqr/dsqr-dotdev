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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="scroll-line absolute top-0 left-[10%] h-[200vh] w-px bg-gradient-to-b from-transparent via-border/30 to-transparent" />
      <div className="scroll-line absolute top-0 left-[25%] h-[250vh] w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      <div className="scroll-line absolute top-0 right-[20%] h-[180vh] w-px bg-gradient-to-b from-transparent via-border/20 to-transparent" />
      <div className="scroll-line absolute top-0 right-[8%] h-[220vh] w-px bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="scroll-line absolute top-[30%] left-[10%] h-1 w-1 rounded-full bg-primary/20" />
      <div className="scroll-line absolute top-[50%] left-[25%] h-1.5 w-1.5 rounded-full bg-primary/15" />
      <div className="scroll-line absolute top-[40%] right-[20%] h-1 w-1 rounded-full bg-border" />
    </div>
  )
}
