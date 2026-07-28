export function ScrollLines() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute top-0 left-[10%] h-full w-px bg-gradient-to-b from-transparent via-border/30 to-transparent" />
      <div className="absolute top-0 left-[25%] h-full w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      <div className="absolute top-0 right-[20%] h-full w-px bg-gradient-to-b from-transparent via-border/20 to-transparent" />
      <div className="absolute top-0 right-[8%] h-full w-px bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="absolute top-[30%] left-[10%] h-1 w-1 rounded-full bg-primary/20" />
      <div className="absolute top-[50%] left-[25%] h-1.5 w-1.5 rounded-full bg-primary/15" />
      <div className="absolute top-[40%] right-[20%] h-1 w-1 rounded-full bg-border" />
    </div>
  )
}
