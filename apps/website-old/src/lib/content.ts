// File-based content handling for MDX posts
import type { PostCategory, PostStatus } from './types'
import { getPostViews, preloadPostViews } from './views'

export type Post = {
  _id: string
  title: string
  date: string
  category: PostCategory
  description?: string
  slug: string
  url: string
  content: string
  views?: number
  status?: PostStatus
}

// Path to the content files in the public directory
const contentDir = '/content/posts';

// Function to get frontmatter from MDX content
function extractFrontmatter(content: string) {
  const frontmatterRegex = /---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return {};
  
  const frontmatterStr = match[1];
  const frontmatter: Record<string, any> = {};
  
  // Extract key-value pairs
  if (!frontmatterStr) return {};
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      // Join the value parts back together and trim quotes if present
      let value = valueParts.join(':').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      frontmatter[key.trim()] = value;
    }
  }
  
  return frontmatter;
}

// Function to get content without frontmatter
function extractContent(content: string) {
  const frontmatterRegex = /---\n[\s\S]*?\n---/;
  return content.replace(frontmatterRegex, '').trim();
}

// Function to get all posts
// Cache for all posts list
let allPostsCache: { posts: Post[], timestamp: number } | null = null;
const ALL_POSTS_CACHE_TTL = 60 * 1000; // 1 minute

export async function getAllPosts(): Promise<Post[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (allPostsCache && now - allPostsCache.timestamp < ALL_POSTS_CACHE_TTL) {
      return [...allPostsCache.posts]; // Return a copy to prevent mutations
    }

    // Get list of available post slugs - hardcoded for now
    // In a real app, you'd want to use a dynamic method to discover posts
    const availableSlugs = [
      'hello-world', 
      'cloudflare-tunnels-cli', 
      'go-nix-flakes',
      'playing-with-nix-templates',
      'self-hosting-email-proxmox-nixos',
      'analytics-cloudflare-api'
    ];
    
    // Use Promise.all to fetch all posts in parallel
    const postPromises = availableSlugs.map(slug => getPostBySlug(slug));
    const postsResults = await Promise.all(postPromises);
    const posts = postsResults.filter((post): post is Post => post !== null);
    
    // Sort posts by date (newest first)
    const sortedPosts = posts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    // No need to load view counts separately as they're already loaded in getPostBySlug
    
    // Cache the result
    allPostsCache = {
      posts: sortedPosts,
      timestamp: now
    };
    
    return sortedPosts;
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
}

// Function to get a post by slug
// Cache for posts to prevent repeated fetches
const postCache: Record<string, { post: Post, timestamp: number }> = {};
const POST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (postCache[slug] && now - postCache[slug].timestamp < POST_CACHE_TTL) {
      return postCache[slug].post;
    }

    // Fetch the post content
    const response = await fetch(`${contentDir}/${slug}.mdx`);
    if (!response.ok) {
      throw new Error(`Failed to fetch post ${slug}: ${response.statusText}`);
    }
    
    const mdxContent = await response.text();
    const frontmatter = extractFrontmatter(mdxContent);
    const content = extractContent(mdxContent);
    
    // Create the post object
    const post: Post = {
      _id: slug,
      title: frontmatter.title || 'Untitled',
      date: frontmatter.date || new Date().toISOString(),
      category: frontmatter.category as PostCategory || 'Blog',
      description: frontmatter.description || '',
      slug,
      url: `/posts/${slug}`,
      content,
      status: frontmatter.status as PostStatus || 'published'
    };
    
    // Get view count (synchronously to avoid delay in rendering)
    post.views = getPostViews(slug);
    
    // Cache the post
    postCache[slug] = {
      post,
      timestamp: now
    };
    
    return post;
  } catch (error) {
    console.error(`Error getting post with slug ${slug}:`, error);
    return null;
  }
}