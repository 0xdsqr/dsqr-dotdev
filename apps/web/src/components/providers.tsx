import { ThemeProvider } from './theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="dsqr-theme">
      {children}
    </ThemeProvider>
  )
}

export type { ProvidersProps }
export { Providers }