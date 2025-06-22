import { FooterModeToggle } from './mode-toggle'
import { github, twitter } from './icons'

function Footer() {
  return (
    <footer className="py-4">
      <div className="max-w-2xl mx-auto px-4">
        <div className="border-t border-[hsl(var(--border))] pt-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span>Dave Dennis </span>
              <a href="https://x.com/0xdsqr" className="hover:text-primary transition-colors">(@0xdsqr)</a>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {github({ 
                href: "https://github.com/dsqr-dev", 
                label: "GitHub" 
              })}
              {twitter({ 
                href: "https://x.com/0xdsqr", 
                label: "X" 
              })}
              <span className="text-muted-foreground/40 mx-1 sm:mx-2">•</span>
              <FooterModeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }