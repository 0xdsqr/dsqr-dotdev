import React from 'react'
import { Link } from '@tanstack/react-router'

// Type for path segments with link options and colors
type PathSegment = {
  name: string;
  href?: string;
  color?: string;
}

interface TerminalPathProps {
  username?: string;
  path: (string | PathSegment)[];
  filename: string;
}

export function TerminalPath({
  username = '0xdsqr',
  path = [],
  filename = '',
}: TerminalPathProps) {
  return (
    <div className="inline-flex items-center px-2 md:px-3 py-1 font-mono text-2xs md:text-xs bg-background border border-border rounded-md overflow-hidden max-w-full">
      {/* Username with link to home */}
      <Link
        to="/"
        className="text-purple-500 dark:text-purple-400 whitespace-nowrap hover:underline"
      >
        {username}
      </Link>
      
      <span className="text-muted-foreground/70 whitespace-nowrap">:~/</span>
      
      {/* Render path segments */}
      {path.map((segment, index) => {
        // Determine if segment is a string or object
        const isObject = typeof segment !== 'string';
        const name = isObject ? segment.name : segment;
        const href = isObject ? segment.href : undefined;
        const color = isObject ? segment.color : undefined;
        
        // Determine color class
        const colorClass = color || 'text-muted-foreground/70';
        
        return (
          <React.Fragment key={index}>
            {href ? (
              <Link
                to={href}
                className={`${colorClass} whitespace-nowrap hover:underline`}
              >
                {name}
              </Link>
            ) : (
              <span className={`${colorClass} whitespace-nowrap overflow-hidden text-ellipsis`}>
                {name}
              </span>
            )}
            <span className="text-muted-foreground/70">/</span>
          </React.Fragment>
        );
      })}
      
      {/* Filename */}
      <span className="text-muted-foreground/70 whitespace-nowrap overflow-hidden text-ellipsis">
        {filename}
      </span>
      
      <span className="text-purple-500 dark:text-purple-400 animate-pulse ml-1 whitespace-nowrap">█</span>
    </div>
  )
}