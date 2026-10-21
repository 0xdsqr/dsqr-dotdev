import { Page } from '@dsqr-dotdev/react/components/page'
import type { ReactNode } from 'react'
import { Subscribe } from './subscribe'

export function SitePage({ centered, children }: { centered?: boolean; children: ReactNode }) {
  return (
    <Page site="dsqr.dev" centered={centered} footerAction={<Subscribe />}>
      {children}
    </Page>
  )
}
