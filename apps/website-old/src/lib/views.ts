// Client-side view tracking with persistent mock data
// This doesn't require a backend server and works with your current Docker setup

// Cache view counts to avoid re-calculating on every render
const viewCache: Record<string, { views: number; timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// DEBUG logging
const DEBUG = false;

/**
 * Generate consistent mock view counts based on the route path
 * This generates different but stable counts for different paths
 */
function generateMockViewCount(route: string): number {
  // Create a hash from the route string
  let hash = 0;
  for (let i = 0; i < route.length; i++) {
    hash = ((hash << 5) - hash) + route.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate a view count between 5-50 based on the hash
  let mockViews = Math.abs(hash % 45) + 5;
  
  // Special cases for our known blog posts
  const normalizedRoute = normalizeRoute(route);
  if (normalizedRoute === '/posts/hello-world') {
    mockViews = 28;
  } else if (normalizedRoute === '/posts/bun-api-with-nix-and-kubernetes') {
    mockViews = 42;
  }
  
  if (DEBUG) console.log(`Generated ${mockViews} mock views for ${route}`);
  return mockViews;
}

/**
 * Fetch view stats for a specific path/route
 */
export async function getViewsForRoute(route: string): Promise<number> {
  try {
    // Check cache first
    const now = Date.now();
    const cacheKey = `views_${route}`;
    
    if (viewCache[cacheKey] && now - viewCache[cacheKey].timestamp < CACHE_TTL) {
      if (DEBUG) console.log(`Using cached views for ${route}: ${viewCache[cacheKey].views}`);
      return viewCache[cacheKey].views;
    }
    
    // Generate mock view count (no artificial delay needed for mock data)
    const views = generateMockViewCount(route);
    
    // Cache the result
    viewCache[cacheKey] = {
      views,
      timestamp: now
    };
    
    return views;
  } catch (error: any) {
    if (DEBUG) console.error(`Error getting view count for ${route}:`, error.message);
    return 0;
  }
}

/**
 * Fetch view stats for multiple paths/routes at once
 */
export async function getBulkViewStats(routes: string[]): Promise<Record<string, number>> {
  try {
    const viewCounts: Record<string, number> = {};
    
    // Get view counts for each route
    for (const route of routes) {
      viewCounts[route] = await getViewsForRoute(route);
    }
    
    return viewCounts;
  } catch (error: any) {
    if (DEBUG) console.error('Error getting bulk view stats:', error.message);
    
    // Return zero views for each route on error
    return routes.reduce((acc, route) => {
      acc[route] = 0;
      return acc;
    }, {} as Record<string, number>);
  }
}

/**
 * Normalize routes for consistent comparison
 */
function normalizeRoute(route: string): string {
  // Remove domain if present
  let path = route.replace(/^https?:\/\/[^\/]+/, '');
  
  // Remove trailing slash if present
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Remove query parameters
  path = path.split('?')[0] || '';
  
  // Remove hash
  path = path.split('#')[0] || '';
  
  return path;
}

/**
 * Get views for a specific blog post by slug (synchronous version)
 */
export function getPostViews(slug: string): number {
  try {
    // Check cache first
    const now = Date.now();
    const route = `/posts/${slug}`;
    const cacheKey = `views_${route}`;
    
    if (viewCache[cacheKey] && now - viewCache[cacheKey].timestamp < CACHE_TTL) {
      return viewCache[cacheKey].views;
    }
    
    // Generate mock view count
    const views = generateMockViewCount(route);
    
    // Cache the result
    viewCache[cacheKey] = {
      views,
      timestamp: now
    };
    
    return views;
  } catch (error) {
    return 0;
  }
}

/**
 * Preload view counts for multiple posts
 */
export async function preloadPostViews(slugs: string[]): Promise<Record<string, number>> {
  const routes = slugs.map(slug => `/posts/${slug}`);
  const viewStats = await getBulkViewStats(routes);
  
  // Convert routes back to slugs for easier lookup
  return Object.entries(viewStats).reduce((acc, [route, views]) => {
    const slug = route.replace('/posts/', '');
    acc[slug] = views;
    return acc;
  }, {} as Record<string, number>);
}