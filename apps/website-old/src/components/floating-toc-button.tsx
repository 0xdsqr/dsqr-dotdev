import { useState, useEffect } from 'react'
import { BookOpenIcon, XIcon } from 'lucide-react'
import { PostToc, TocItem } from './post-toc'

interface FloatingTocButtonProps {
  activeSection: string
  items?: TocItem[]
}

export function FloatingTocButton({ activeSection, items }: FloatingTocButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Track scroll position to show/hide the button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled past ~500px
      if (window.scrollY > 500) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
        // Auto-close TOC when scrolling back to top
        if (isOpen) setIsOpen(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])
  
  // Close TOC when clicking outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('.floating-toc') && !target.closest('.floating-toc-button')) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])
  
  // Toggle TOC visibility
  const toggleToc = () => {
    setIsOpen(prev => !prev)
  }
  
  if (!isVisible) return null
  
  return (
    <>
      {/* Floating button - increased size and improved hit area */}
      <button
        className="floating-toc-button fixed bottom-4 right-4 z-50 p-3 bg-background border border-border shadow-lg rounded-full text-foreground flex items-center justify-center w-12 h-12 touch-manipulation hover:bg-muted transition-colors"
        onClick={toggleToc}
        aria-label={isOpen ? "Close table of contents" : "Open table of contents"}
      >
        {isOpen ? (
          <XIcon className="w-6 h-6 pointer-events-none" />
        ) : (
          <BookOpenIcon className="w-6 h-6 pointer-events-none" />
        )}
      </button>
      
      {/* Floating TOC panel - always expanded without dropdown */}
      {isOpen && (
        <div className="floating-toc fixed bottom-16 right-4 z-50 p-4 bg-background border border-border shadow-lg rounded-md max-w-[16rem] max-h-[80vh] overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2">On this page</h3>
          <nav className="space-y-2">
            {(items || []).length > 0 ? (
              items?.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-sm ${
                    activeSection === item.id 
                      ? "text-purple-600 dark:text-purple-400" 
                      : "text-muted-foreground hover:text-foreground"
                  } ${item.level === 3 ? "ml-4" : ""}`}
                >
                  {item.text}
                </a>
              ))
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <PostToc 
                  activeSection={activeSection} 
                  items={items} 
                  dropdownAlwaysOpen={true}
                  showButton={false}
                />
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}