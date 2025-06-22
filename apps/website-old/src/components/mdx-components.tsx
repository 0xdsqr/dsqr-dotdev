import React from 'react'
import { Link } from '@tanstack/react-router'

// Custom component interface
interface ComponentProps {
  children?: React.ReactNode;
  [key: string]: any;
}

// No special props needed, we'll keep it simple
interface MoreInfoProps extends ComponentProps {}

// Export callout components directly so they can be imported and used
export const Important = ({ children }: ComponentProps) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 my-6 rounded-r">
    <div className="prose dark:prose-invert prose-p:m-0 prose-p:text-yellow-800 dark:prose-p:text-yellow-200 font-medium">
      {typeof children === 'string' ? children : children}
    </div>
  </div>
)

export const Note = ({ children }: ComponentProps) => (
  <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 my-6 rounded-r">
    <div className="prose dark:prose-invert prose-p:m-0 prose-p:text-blue-800 dark:prose-p:text-blue-200 font-medium">
      {typeof children === 'string' ? children : children}
    </div>
  </div>
)

export const Tip = ({ children }: ComponentProps) => (
  <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 my-6 rounded-r">
    <div className="prose dark:prose-invert prose-p:m-0 prose-p:text-green-800 dark:prose-p:text-green-200 font-medium">
      {typeof children === 'string' ? children : children}
    </div>
  </div>
)

export const Warning = ({ children }: ComponentProps) => (
  <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 my-6 rounded-r">
    <div className="prose dark:prose-invert prose-p:m-0 prose-p:text-orange-800 dark:prose-p:text-orange-200 font-medium">
      {typeof children === 'string' ? children : children}
    </div>
  </div>
)

export const Caution = ({ children }: ComponentProps) => (
  <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 my-6 rounded-r">
    <div className="prose dark:prose-invert prose-p:m-0 prose-p:text-red-800 dark:prose-p:text-red-200 font-medium">
      {typeof children === 'string' ? children : children}
    </div>
  </div>
)

export function MoreInfo({ children }: MoreInfoProps) {
  return (
    <div className="mt-12 mb-8 border-t border-gray-200 dark:border-gray-800 pt-8">
      {/* Hidden heading for TOC, but visible to screen readers */}
      <h2 id="more-information" className="sr-only">More Information</h2>
      
      <div className="flex gap-5 items-start">
        <img 
          src="/me-ghibli.png" 
          alt="dsqr avatar" 
          className="w-20 h-20 rounded-full hidden md:block flex-shrink-0"
        />
        <div className="prose dark:prose-invert max-w-none prose-a:text-purple-600 prose-a:italic prose-a:dark:text-purple-400 hover:prose-a:underline">
          {children}
        </div>
      </div>
    </div>
  )
}

// All MDX components
export const mdxComponents = {
  Important,
  Note,
  Tip,
  Warning,
  Caution,
  MoreInfo,
  h1: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
  ),
  h2: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />
  ),
  h3: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />
  ),
  h4: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />
  ),
  p: ({ ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-7 my-2" {...props} />
  ),
  ul: ({ ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside pl-5 my-4" {...props} />
  ),
  ol: ({ ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside pl-5 my-4" {...props} />
  ),
  li: ({ ...props }: React.HTMLAttributes<HTMLLIElement>) => <li className="my-1" {...props} />,
  blockquote: ({ ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic text-gray-600 dark:text-gray-400"
      {...props}
    />
  ),
  a: ({ href = "", ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href.startsWith("/")) {
      return <Link to={href} className="text-primary underline underline-offset-4" {...props} />
    }
    if (href.startsWith("#")) {
      return <a href={href} className="text-primary underline underline-offset-4" {...props} />
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4"
        {...props}
      />
    )
  },
  img: ({ src = "", alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return (
      <img 
        src={src || "/placeholder.svg"} 
        alt={alt} 
        className="rounded-md my-4" 
        {...props} 
      />
    );
  },
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-gray-300 dark:border-gray-700" {...props} />
  ),
  table: ({ ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  tr: ({ ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-gray-300 dark:border-gray-700" {...props} />
  ),
  th: ({ ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-left py-2 px-4 font-semibold" {...props} />
  ),
  td: ({ ...props }: React.HTMLAttributes<HTMLTableCellElement>) => <td className="py-2 px-4" {...props} />,
  pre: ({ ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="rounded-md my-6 overflow-x-auto bg-transparent p-0" {...props} />
  ),
  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { 
    'data-meta'?: string, 
    'data-language'?: string,
    inline?: boolean,
    node?: {
      parentNode?: {
        tagName?: string
      }
    }
  }) => {
    const match = /language-(\w+)/.exec(className || "")
    // Check for filename metadata in format ```js filename=example.js
    const filenameMatch = props['data-meta']?.match(/filename=([^\s]+)/)
    const language = props['data-language'] || match?.[1] || ''
    
    let updatedClassName = className || ""
    if (filenameMatch) {
      updatedClassName += ` filename-${filenameMatch[1]}`
    }

    // Check if this is an inline code block
    const isInline = props.inline || 
                     // Rely on React Markdown's own detection (if parent is not 'pre')
                     !props.node?.parentNode?.tagName || 
                     props.node?.parentNode?.tagName !== 'pre'

    return !isInline && match ? (
      // Code block styling - minimal here as rehype plugin handles most styling
      <code 
        className={updatedClassName} 
        {...props}
        data-language={language}
      >
        {children}
      </code>
    ) : (
      // Inline code styling
      <code className="font-mono text-sm px-1.5 py-0.5 rounded border" {...props}>
        {children}
      </code>
    )
  },
}