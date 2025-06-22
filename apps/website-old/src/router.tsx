import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import RootLayout from './components/root-layout'
import HomePage from './routes'
import PostsPage from './routes/posts'
import PostPage from './routes/posts/post'
import AboutPage from './routes/about'
import MiscPage from './routes/misc'

// Create the root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <RootLayout />
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </>
  ),
})

// Define all routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts',
  component: PostsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: search.category as string | undefined,
      sort: search.sort as string | undefined,
      order: search.order as 'asc' | 'desc' | undefined,
    }
  },
})

const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts/$slug',
  component: PostPage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const miscRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/misc',
  component: MiscPage,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  postsRoute,
  postRoute,
  aboutRoute,
  miscRoute,
])

// Create the router with proper defaults and validation
export const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register types
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}