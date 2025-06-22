import React, { useState, useCallback, useEffect } from 'react'
import { mdxComponents, Important, Note, Tip, Warning, Caution, MoreInfo } from './mdx-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
// Import Prism for syntax highlighting
// @ts-ignore
import Prism from 'prismjs'
// Import basic languages
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
// Add more language support
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'

// Add Nix language support manually since it's not included by default
Prism.languages.nix = {
  'comment': /#.*/,
  'string': {
    pattern: /"(?:[^"\\]|\\[\s\S])*"|''(?:(?!'')[\s\S]|''(?:'|\\|\$\{))*''/,
    greedy: true,
    inside: {
      'interpolation': {
        pattern: /\$\{[\s\S]*?\}/,
        inside: {
          'expression': {
            pattern: /[\s\S]+/,
            inside: null // Will be set later
          }
        }
      }
    }
  },
  'keyword': /\b(?:assert|builtins|else|if|in|inherit|let|rec|then|with)\b/,
  'function': /\b(?:abort|add|all|any|attrNames|attrValues|baseNameOf|compareVersions|concatLists|currentSystem|deepSeq|derivation|dirOf|div|elem(?:At)?|fetchurl|filter|findFile|foldl|foldl'|genList|getAttr|getEnv|hasAttr|hashString|head|import|intersectAttrs|isAttrs|isBool|isFunction|isInt|isList|isString|length|lessThan|listToAttrs|map|mul|nixVersion|parseDrvName|pathExists|readDir|readFile|removeAttrs|replaceStrings|seq|sort|stringLength|sub|substring|tail|throw|toString|toXML|trace|typeOf)\b|\bfetchTarball\b/,
  'boolean': /\b(?:false|true)\b/,
  'operator': /[=!<>]=?|\+\+?|\|\||&&|\/\/|->?|[?@]/,
  'punctuation': /[{}()[\].,:;]/,
  'number': /\b\d+\b/,
};

// Self reference for nested expressions
Prism.languages.nix.string.inside.interpolation.inside.expression.inside = Prism.languages.nix;
// Import line numbers and line highlight plugins
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-highlight/prism-line-highlight'

// Import our custom rehype plugin
import { rehypeCodeBlocks } from '../lib/rehype-code-blocks'

interface MdxContentProps {
  content: string
}

// Parse the markdown to replace custom components with their JSX equivalents
const processMarkdown = (markdown: string): string => {
  // Replace custom component tags with a unique format that React Markdown can parse
  let processedContent = markdown
    // First remove any import statements
    .replace(/import.*from.*;\n?/g, '')
    
    // Process each callout type with a single paragraph format
    .replace(/<Important>([\s\S]*?)<\/Important>/g, (_, content) => {
      // Join all lines to ensure they're treated as a single paragraph
      const formattedContent = content.trim().split('\n').join(' ');
      return `:::important\n${formattedContent}\n:::`;
    })
    .replace(/<Note>([\s\S]*?)<\/Note>/g, (_, content) => {
      const formattedContent = content.trim().split('\n').join(' ');
      return `:::note\n${formattedContent}\n:::`;
    })
    .replace(/<Tip>([\s\S]*?)<\/Tip>/g, (_, content) => {
      const formattedContent = content.trim().split('\n').join(' ');
      return `:::tip\n${formattedContent}\n:::`;
    })
    .replace(/<Warning>([\s\S]*?)<\/Warning>/g, (_, content) => {
      const formattedContent = content.trim().split('\n').join(' ');
      return `:::warning\n${formattedContent}\n:::`;
    })
    .replace(/<Caution>([\s\S]*?)<\/Caution>/g, (_, content) => {
      const formattedContent = content.trim().split('\n').join(' ');
      return `:::caution\n${formattedContent}\n:::`;
    })
    // Simplified MoreInfo component processing
    .replace(/<MoreInfo[^>]*>([\s\S]*?)<\/MoreInfo>/g, (_, content) => {
      return `:::moreinfo\n${content.trim()}\n:::`;
    });
  
  return processedContent;
}

export function MdxContent({ content }: MdxContentProps) {
  // Handle case where content might be undefined or null
  if (!content) {
    console.warn("MDX content is empty or undefined")
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 my-6 rounded-r">
        <div className="font-medium text-yellow-800 dark:text-yellow-200">
          Content could not be loaded.
        </div>
      </div>
    )
  }
  
  const processedContent = processMarkdown(content)
  
  // Simplified line number function that won't cause flickering
  const addLineNumbers = useCallback(() => {
    document.querySelectorAll('pre.line-numbers').forEach(pre => {
      // Skip if already processed
      if (pre.querySelector('.line-numbers-rows')) return;
      
      // Add code-block class for styling
      pre.classList.add('code-block');
      if (pre.parentElement) {
        pre.parentElement.classList.add('code-block');
      }
      
      const linesCount = (pre.textContent?.match(/\n/g) || []).length + 1;
      
      // Create line number rows
      const lineNumbersWrapper = document.createElement('span');
      lineNumbersWrapper.className = 'line-numbers-rows';
      lineNumbersWrapper.setAttribute('aria-hidden', 'true');
      
      let lineNumbersMarkup = '';
      for (let i = 0; i < linesCount; i++) {
        lineNumbersMarkup += '<span></span>';
      }
      
      lineNumbersWrapper.innerHTML = lineNumbersMarkup;
      pre.appendChild(lineNumbersWrapper);
    });
  }, []);

  // Combined effect for syntax highlighting and line numbers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply syntax highlighting first
      const timer = setTimeout(() => {
        Prism.highlightAll();
        // Then apply line numbers
        setTimeout(addLineNumbers, 10);
      }, 0);
      
      // Fallback for late-loading content
      const fallbackTimer = setTimeout(() => {
        Prism.highlightAll();
        addLineNumbers();
      }, 300);
      
      // Handle scroll events
      const handleScroll = () => {
        Prism.highlightAll();
        // Don't reapply line numbers on scroll to avoid flickering
      };
      
      // Debounce scroll events
      let scrollTimer: number | null = null;
      const debouncedHandleScroll = () => {
        if (scrollTimer !== null) {
          clearTimeout(scrollTimer);
        }
        scrollTimer = window.setTimeout(handleScroll, 100);
      };
      
      window.addEventListener('scroll', debouncedHandleScroll);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
        window.removeEventListener('scroll', debouncedHandleScroll);
      }
    }
  }, [processedContent, addLineNumbers])
  
  // Add a second effect that triggers on window focus
  useEffect(() => {
    const handleFocus = () => {
      Prism.highlightAll()
      setTimeout(addLineNumbers, 10)
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [addLineNumbers])
  
  try {
    return (
      <div className="mdx prose dark:prose-invert prose-pre:p-0 prose-code:text-sm prose-code:font-normal w-full md:max-w-2xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeSlug, 
            rehypeAutolinkHeadings
          ]}
          components={{
            ...mdxComponents,
            // Handle code blocks with syntax highlighting
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '')
              
              // For inline code - use better detection to ensure paths like `~/.config/nix/nix.conf` work properly
              if (inline || (!className && (!node.parent || node.parent.tagName !== 'pre'))) {
                return (
                  <code 
                    className="relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm border" 
                    {...props}
                    inline="true"
                  >
                    {children}
                  </code>
                )
              }
              
              // Extract meta information like filename
              const meta = props["data-meta"] || ''
              const language = match ? match[1] : ''
              const filenameMatch = meta?.match(/filename=([^\s]+)/)
              const filename = filenameMatch ? filenameMatch[1] : null
              
              // The code content as a string for copying
              const codeString = String(children).replace(/\n$/, '')
              const [isCopied, setIsCopied] = useState(false)
              
              const copyToClipboard = useCallback(() => {
                navigator.clipboard.writeText(codeString)
                  .then(() => {
                    setIsCopied(true)
                    setTimeout(() => setIsCopied(false), 2000)
                  })
                  .catch(err => console.error('Failed to copy: ', err))
              }, [codeString])
              
              // Extract highlighted lines if any
              const highlightMatch = meta?.match(/\{([\d,-]+)\}/)
              const highlightLines: number[] = []
              
              if (highlightMatch) {
                const lineNumbers = highlightMatch[1].split(',')
                lineNumbers.forEach((num: string) => {
                  if (num.includes('-')) {
                    const [start, end] = num.split('-').map(Number)
                    if (start !== undefined && end !== undefined) {
                      for (let i = start; i <= end; i++) {
                        highlightLines.push(i)
                      }
                    }
                  } else {
                    const lineNum = Number(num)
                    if (!isNaN(lineNum)) {
                      highlightLines.push(lineNum)
                    }
                  }
                })
              }
              
              // Add data attribute for highlighted lines
              const dataLine = highlightLines.length ? highlightLines.join(',') : ''
              
              return (
                <div className="code-block relative not-prose group">
                  {/* Filename header if present */}
                  {filename && (
                    <div className="file-header">
                      <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {filename}
                      </span>
                    </div>
                  )}
                  
                  {/* Language indicator */}
                  {language && (
                    <div className="language-badge">
                      {language}
                    </div>
                  )}
                  
                  {/* Pre element with code content */}
                  <pre className={`${className || ''} line-numbers code-block`} data-line={dataLine}>
                    <code className={className || ''}>
                      {children}
                    </code>
                  </pre>
                  
                  {/* Copy button */}
                  <button
                    className="copy-button"
                    onClick={copyToClipboard}
                    aria-label={isCopied ? "Copied!" : "Copy code"}
                  >
                    {isCopied ? (
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
              )
            },
            // Custom parser for React Markdown to detect our special formats
            p(props) {
              const { children } = props;
              const childrenArray = React.Children.toArray(children);
              
              // Check if this paragraph is a callout block
              if (childrenArray[0] && typeof childrenArray[0] === 'string') {
                const text = childrenArray[0].toString();
                
                // Helper function to extract content and handle any potential formatting issues
                const extractCalloutContent = (prefix: string) => {
                  // Remove the prefix marker and any trailing marker in one step
                  // This ensures we capture all content between markers as a single block
                  return text.replace(new RegExp(`^:::${prefix}\\s*`), '')
                    .replace(/\s*:::$/, '')
                    .trim();
                };
                
                if (text.startsWith(':::important')) {
                  return <Important>{extractCalloutContent('important')}</Important>;
                }
                if (text.startsWith(':::note')) {
                  return <Note>{extractCalloutContent('note')}</Note>;
                }
                if (text.startsWith(':::tip')) {
                  return <Tip>{extractCalloutContent('tip')}</Tip>;
                }
                if (text.startsWith(':::warning')) {
                  return <Warning>{extractCalloutContent('warning')}</Warning>;
                }
                if (text.startsWith(':::caution')) {
                  return <Caution>{extractCalloutContent('caution')}</Caution>;
                }
                
                if (text.startsWith(':::moreinfo')) {
                  // Simple extraction of content
                  const content = text.replace(/^:::moreinfo\s*/, '')
                                      .replace(/\s*:::$/, '')
                                      .trim();
                  
                  return <MoreInfo>{content}</MoreInfo>;
                }
              }
              
              // If not a special block, render as normal paragraph
              return <p {...props} />;
            }
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    )
  } catch (error) {
    console.error("Error in MDX component:", error)
    
    // Return a meaningful error message
    return (
      <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded">
        <p className="text-red-800 dark:text-red-200">
          Error rendering content: {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
          This might be due to missing content generation in the build process.
        </p>
      </div>
    )
  }
}