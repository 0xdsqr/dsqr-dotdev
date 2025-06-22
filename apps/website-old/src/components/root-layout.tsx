import { useEffect, useState } from 'react'
import { ThemeProvider } from './providers'
import { Footer } from './footer'
import { Outlet } from '@tanstack/react-router'

// In Vite, we need to handle fonts differently without next/font
// We'll use CSS variables and web fonts loaded via index.html for simplicity
const fontStyles = {
  '--font-inter': '"Inter", sans-serif',
  '--font-mono': '"JetBrains Mono", monospace',
}

export default function RootLayout() {
  // State to prevent hydration issues with the theme
  const [mounted, setMounted] = useState(false)
  
  // After mounting, we can render theme-dependent content
  useEffect(() => {
    setMounted(true)
    
    // Add font links to the document head
    const interLink = document.createElement('link')
    interLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    interLink.rel = 'stylesheet'
    
    const monoLink = document.createElement('link')
    monoLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'
    monoLink.rel = 'stylesheet'
    
    document.head.appendChild(interLink)
    document.head.appendChild(monoLink)
    
    return () => {
      document.head.removeChild(interLink)
      document.head.removeChild(monoLink)
    }
  }, [])
  
  // Avoiding hydration mismatch
  if (!mounted) {
    return null
  }
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <div style={fontStyles as React.CSSProperties} className="font-mono antialiased">
        <div className="flex flex-col">
          <Outlet />
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  )
}