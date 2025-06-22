import { ChevronRightIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

type BreadcrumbItem = {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-1" />}
              {isLast ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : (
                <Link to={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}