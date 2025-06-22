import { useState, useEffect } from 'react'
import { Newsletter } from '@/components/newsletter'
import { SocialLinks } from '@/components/social-links'
import { Link } from '@tanstack/react-router'
import { GithubIcon, ChevronRightIcon } from 'lucide-react'
import { PostList } from '@/components/post-list'
import { getAllPosts } from '@/lib/content'
import type { Post } from '@/lib/content'

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

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
        <SocialLinks />
        
        <Newsletter />
        
        <div className="mt-8">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading posts...</div>
          ) : (
            <>
              <PostList posts={posts.slice(0, 5)} />
              <div className="flex justify-end mt-6">
                <Link
                  to="/posts"
                  search={{category: undefined, sort: undefined, order: undefined}}
                  className="text-sm text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                >
                  View all posts
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
  )
}