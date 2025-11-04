import { createContext, useContext, useEffect, useRef, useState } from "react"

interface HeadingContextType {
  activeHeadingId: string
  setActiveHeadingId: (id: string) => void
}

const HeadingContext = createContext<HeadingContextType | undefined>(undefined)

export function HeadingProvider({ children }: { children: React.ReactNode }) {
  const [activeHeadingId, setActiveHeadingId] = useState("")
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const headingElements = document.querySelectorAll("[data-heading-id]")

    if (headingElements.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries[0]
          setActiveHeadingId(topEntry.target.id)
        }
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
  }, [])

  return (
    <HeadingContext.Provider value={{ activeHeadingId, setActiveHeadingId }}>
      {children}
    </HeadingContext.Provider>
  )
}

export function useHeadingContext() {
  const context = useContext(HeadingContext)
  if (!context) {
    throw new Error("useHeadingContext must be used within HeadingProvider")
  }
  return context
}
