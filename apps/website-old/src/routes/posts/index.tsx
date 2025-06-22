import { useState, useEffect } from 'react'
import { getAllPosts } from '@/lib/content'
import { PostList } from '@/components/post-list'
import { SocialLinks } from '@/components/social-links'
import { TerminalPath } from '@/components/terminal-path'
import { useSearch } from '@tanstack/react-router'
import type { Post } from '@/lib/content'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  // Define a type for the search params
  interface SearchParams {
    category?: string;
    sort?: string;
    order?: string;
    [key: string]: any;
  }
  
  let search: SearchParams = {};
  try {
    search = useSearch({ from: '/posts' }) as SearchParams;
  } catch (error) {
    // Handle case where route doesn't match
    console.log('Route not matched for search params');
  }

  useEffect(() => {
    async function loadPosts() {
      try {
        const allPosts = await getAllPosts()
        setPosts(allPosts)
      } catch (error) {
        console.error('Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 pt-16 pb-8 flex-1">
        {/* Top navigation */}
        <SocialLinks />
        
        {/* Terminal-style path indicator */}
        <div className="mb-8 text-center">
          <TerminalPath 
            path={[
              { 
                name: 'posts', 
                href: '/posts', 
                color: 'text-purple-500 dark:text-purple-400' 
              }
            ]} 
            filename={search.category ? `filter:${search.category}` : ''} 
          />
        </div>
        
        <div className="prose dark:prose-invert max-w-none mb-8">
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground">
            A collection of articles, notes, and thoughts on software engineering, cloud infrastructure, and other topics.
          </p>
        </div>
        
        <div className="mt-8">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading posts...</div>
          ) : (
            <PostList posts={posts} />
          )}
        </div>
      </main>
  )
}