import { ThemeProvider } from './theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider 
      defaultTheme="system" 
      storageKey="dsqr-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

export type { ProvidersProps }
export { Providers }