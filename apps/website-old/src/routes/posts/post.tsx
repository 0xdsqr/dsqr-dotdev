import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { getPostBySlug } from '@/lib/content'
import { MdxContent } from '@/components/mdx-content'
import { SocialLinks } from '@/components/social-links'
import { PostToc } from '@/components/post-toc'
import { FloatingTocButton } from '@/components/floating-toc-button'
import { TerminalPath } from '@/components/terminal-path'
import { CalendarIcon, EyeIcon, TagIcon, RefreshCcwIcon } from 'lucide-react'
import type { Post } from '@/lib/content'

export default function PostPage() {
  // Get the slug from route params
  const { slug } = useParams({ from: '/posts/$slug' })
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("")
  
  // Setup intersection observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.5 },
    )

    // Observe h2 and h3 headings in the article
    const sections = document.querySelectorAll("article h2, article h3")
    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [post])

  useEffect(() => {
    async function loadPost() {
      try {
        const foundPost = await getPostBySlug(slug)
        setPost(foundPost)
      } catch (error) {
        console.error(`Error loading post with slug ${slug}:`, error)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug])
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
        <SocialLinks />
        <div className="py-8 text-muted-foreground">Loading post...</div>
      </div>
    )
  }
  
  // If post not found
  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
        <SocialLinks />
        <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground">The post you're looking for doesn't exist or has been moved.</p>
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-2 sm:px-4 pt-10 sm:pt-16 pb-8 sm:pb-12 w-full">
      {/* Top navigation */}
      <SocialLinks />
      
      {/* Terminal-style path indicator with links */}
      <div className="max-w-2xl mx-auto mb-3 sm:mb-5 text-center">
        <TerminalPath 
          path={[
            { name: 'posts', href: '/posts', color: 'text-purple-500 dark:text-purple-400' },
            { 
              name: post.category.toLowerCase(), 
              ...(post.category === 'Blog' ? { href: '/posts?category=Blog', color: 'text-indigo-600 dark:text-indigo-400' } : 
                  post.category === 'TIL' ? { href: '/posts?category=TIL', color: 'text-emerald-600 dark:text-emerald-400' } : 
                  post.category === 'NixWithMe' ? { href: '/posts?category=NixWithMe', color: 'text-cyan-600 dark:text-cyan-400' } :
                  post.category === 'Life' ? { href: '/posts?category=Life', color: 'text-rose-600 dark:text-rose-400' } :
                  { href: `/posts?category=${post.category}` })
            }
          ]} 
          filename={slug} 
        />
      </div>
      
      {/* Mobile Table of Contents for dropdown - matched to content width */}
      <div className="w-full max-w-2xl mx-auto mb-4 sm:mb-8 lg:hidden px-4">
        <PostToc activeSection={activeSection} mobileOnly={true} />
      </div>
      
      <div className="relative w-full">
        {/* Main content and sidebar layout */}
        <div className="flex flex-col lg:flex-row lg:justify-center">
          {/* Left spacer to help with centering */}
          <div className="hidden lg:block lg:w-48"></div>
          
          {/* Main content column */}
          <div className="w-full lg:max-w-2xl lg:mx-0">
            <div className="space-y-4 sm:space-y-8 px-2 md:px-4">
              {/* Post title and metadata */}
              <div className="mb-4 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{post.title}</h1>
                <div className="flex items-center flex-nowrap text-xs sm:text-sm text-muted-foreground overflow-x-auto pb-1">
                  <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap mr-2 sm:mr-4">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap mr-2 sm:mr-4">
                    <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    {post.views !== undefined ? post.views : '–'}
                  </div>
                  <div
                    className={`flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                      post.category === "TIL"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : post.category === "Blog"
                          ? "text-indigo-600 dark:text-indigo-400"
                          : post.category === "NixWithMe"
                            ? "text-cyan-600 dark:text-cyan-400"
                            : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    <TagIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    {post.category}
                  </div>
                  {post.status === 'evolving' && (
                    <div className="flex items-center gap-1 sm:gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 sm:px-2 py-0.5 rounded-full whitespace-nowrap ml-2 sm:ml-4 flex-shrink-0">
                      <RefreshCcwIcon className="w-3 h-3 sm:w-4 sm:h-4 evolving-icon flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Evolving</span>
                      <span className="hidden sm:inline text-xs text-amber-500 dark:text-amber-500">(content will be updated as I learn)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Main content */}
              <article className="prose prose-sm sm:prose dark:prose-invert w-full">
                <MdxContent content={post.content} />
              </article>
            </div>
          </div>

          {/* Desktop Table of Contents - Right sidebar, now positioned with flexbox */}
          <div className="hidden lg:block lg:w-56 lg:ml-4">
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold mb-4">On this page</h3>
              <PostToc activeSection={activeSection} desktopOnly={true} />
            </div>
          </div>
        </div>
        
        {/* Floating TOC button that appears when scrolled past table of contents */}
        <FloatingTocButton activeSection={activeSection} />
      </div>
    </main>
  )
}