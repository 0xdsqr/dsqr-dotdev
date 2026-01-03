"use client"

import {
  Bold,
  Code,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface EditorToolbarProps {
  onFormat: (format: string) => void
}

const tools = [
  { icon: Bold, format: "bold", label: "Bold (Ctrl+B)" },
  { icon: Italic, format: "italic", label: "Italic (Ctrl+I)" },
  { icon: Code, format: "code", label: "Inline Code" },
  { icon: Link, format: "link", label: "Link" },
  { type: "separator" },
  { icon: Heading1, format: "h1", label: "Heading 1" },
  { icon: Heading2, format: "h2", label: "Heading 2" },
  { icon: Heading3, format: "h3", label: "Heading 3" },
  { type: "separator" },
  { icon: Quote, format: "quote", label: "Blockquote" },
  { icon: List, format: "ul", label: "Bullet List" },
  { icon: ListOrdered, format: "ol", label: "Numbered List" },
  { icon: FileCode, format: "codeblock", label: "Code Block" },
] as const

export function EditorToolbar({ onFormat }: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {tools.map((tool, index) => {
          if ("type" in tool && tool.type === "separator") {
            return <div key={index} className="w-px h-4 bg-border mx-1" />
          }

          if (!("icon" in tool)) return null

          const Icon = tool.icon
          return (
            <Tooltip key={tool.format}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onFormat(tool.format)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
