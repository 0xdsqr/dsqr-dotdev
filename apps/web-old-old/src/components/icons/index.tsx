import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconVariants = cva(
  "inline-flex items-center justify-center transition-colors",
  {
    variants: {
      variant: {
        default: "text-current",
        muted: "text-muted-foreground",
        primary: "text-primary",
        destructive: "text-destructive",
        purple: "text-purple-400",
      },
      size: {
        default: "h-4 w-4 sm:h-5 sm:w-5",
        sm: "h-3 w-3 sm:h-4 sm:w-4",
        lg: "h-5 w-5 sm:h-6 sm:w-6",
        xl: "h-6 w-6 sm:h-7 sm:w-7",
      },
      hover: {
        default: "hover:text-primary",
        none: "",
        primary: "hover:text-primary/80",
        destructive: "hover:text-destructive/80",
        purple: "hover:text-purple-300",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "default",
    },
  }
)

interface IconProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof iconVariants> {
  asChild?: boolean
  label?: string
  href?: string
}

function Icon({
  className,
  variant,
  size,
  hover,
  children,
  href,
  label,
  ...props
}: IconProps & { children: React.ReactNode }) {
  const content = (
    <span
      className={cn(iconVariants({ variant, size, hover, className }))}
      aria-hidden="true"
      role="img"
      aria-label={label}
    >
      {children}
    </span>
  )

  if (href) {
    return (
      <a 
        href={href} 
        className="inline-flex"
        aria-label={label}
      >
        {content}
      </a>
    )
  }

  return content
}

function createIcon(svgPath: React.ReactNode, defaultProps = {}) {
  return function({ className, ...props }: IconProps) {
    return (
      <Icon 
        className={className} 
        {...defaultProps}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {svgPath}
        </svg>
      </Icon>
    )
  }
}

function github({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.334-1.755-1.334-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12" />
      </svg>
    </Icon>
  )
}

function twitter({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </Icon>
  )
}

function sun({ className, ...props }: IconProps) {
  return (
    <Icon className={className} variant="primary" {...props}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="text-yellow-500"
      >
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>
    </Icon>
  )
}

function moon({ className, ...props }: IconProps) {
  return (
    <Icon className={className} variant="purple" {...props}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
      </svg>
    </Icon>
  )
}

function square({ className, ...props }: IconProps) {
  return (
    <Icon className={className} size="sm" {...props}>
      <svg 
        viewBox="0 0 16 16" 
        fill="currentColor" 
      >
        <rect width="16" height="16" rx="2" />
      </svg>
    </Icon>
  )
}

export { Icon, iconVariants, createIcon, github, twitter, sun, moon, square }
export type { IconProps }