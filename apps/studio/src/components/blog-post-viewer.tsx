import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface BlogPostViewerProps {
  content: string
}

export function BlogPostViewer({ content }: BlogPostViewerProps) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </Markdown>
    </article>
  )
}
