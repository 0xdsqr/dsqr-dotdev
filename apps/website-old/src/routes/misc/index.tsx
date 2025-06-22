import { useState, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-yaml'
import { SocialLinks } from '@/components/social-links'
import { PostToc, TocItem } from '@/components/post-toc'
import { TerminalPath } from '@/components/terminal-path'
import { FloatingTocButton } from '@/components/floating-toc-button'
import { Check, Copy } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

export default function MiscPage() {
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState("gpg-key")
  
  // Define manual TOC items for misc page
  const tocItems: TocItem[] = [
    { id: "gpg-key", text: "GPG Key", level: 2 }
  ]

  const gpgKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
bingbong
-----END PGP PUBLIC KEY BLOCK-----`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gpgKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.5 },
    )

    const sections = document.querySelectorAll("section")
    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [])
  
  // Apply syntax highlighting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply syntax highlighting with a small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        Prism.highlightAll()
      }, 0)
      
      return () => {
        clearTimeout(timer)
      }
    }
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-4 pt-16 pb-12 w-full">
      {/* Top navigation */}
      <SocialLinks />
      
      {/* Terminal-style path indicator with links */}
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <TerminalPath 
          path={[
            { 
              name: 'misc', 
              href: '/misc', 
              color: 'text-purple-500 dark:text-purple-400' 
            }
          ]} 
          filename="" 
        />
        
        {/* Mobile Table of Contents (only visible on mobile) */}
        <div className="md:hidden mt-4">
          <PostToc activeSection={activeSection} items={tocItems} />
        </div>
      </div>
      
      <div className="relative w-full">
        {/* Main content */}
        <div className="w-full"> 
          {/* Main content wrapper */}
          <div className="space-y-8 max-w-2xl mx-auto px-4">
            <section id="gpg-key" className="w-full">
              <h2 className="text-2xl font-semibold mb-4">GPG Key</h2>
              <div className="code-block relative not-prose group w-full" style={{ width: '100%' }}>
                <pre className="p-0 overflow-x-auto w-full language-yaml line-numbers code-block" style={{ width: '100%' }}>
                  <code className="language-yaml p-4 block w-full" style={{ width: '100%', display: 'block' }}>{gpgKey}</code>
                </pre>
                <button
                  className="copy-button"
                  onClick={copyToClipboard}
                  aria-label={copied ? "Copied!" : "Copy code"}
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Desktop Table of Contents - Right sidebar */}
        <div className="hidden md:block absolute right-4 top-0">
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold mb-4">On this page</h3>
            <PostToc activeSection={activeSection} items={tocItems} />
          </div>
        </div>
        
        {/* Floating TOC button that appears when scrolled past table of contents */}
        <FloatingTocButton activeSection={activeSection} items={tocItems} />
      </div>
    </main>
  )
}