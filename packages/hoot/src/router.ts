import { Element } from "./types.js"

export interface RouteConfig {
  path: string
  component: () => Element
}

export interface RouterConfig {
  routes: RouteConfig[]
  notFound?: () => Element
}

export interface Router {
  navigate(path: string): void
  getCurrentComponent(): Element
  subscribe(listener: () => void): () => void
}

let currentRouter: Router | null = null
let appContainer: HTMLElement | null = null
let appFunction: (() => Element) | null = null

function findRoute(routes: RouteConfig[], path: string): RouteConfig | null {
  return routes.find((route) => route.path === path) || null
}

function autoRerender() {
  if (appContainer && appFunction) {
    import("./render.js").then(({ render }) => {
      appContainer!.innerHTML = ""
      render(appFunction!(), appContainer!)
    })
  }
}

export function createRouter(config: RouterConfig): Router {
  const listeners = new Set<() => void>()

  const getCurrentPath = (): string => {
    return window.location.pathname || "/"
  }

  const notifyListeners = () => {
    listeners.forEach((listener) => listener())
    autoRerender()
  }

  window.addEventListener("popstate", notifyListeners)

  const router: Router = {
    navigate: (path: string) => {
      window.history.pushState({}, "", path)
      notifyListeners()
    },

    getCurrentComponent: () => {
      const currentPath = getCurrentPath()
      const route = findRoute(config.routes, currentPath)

      if (route) {
        return route.component()
      }

      if (config.notFound) {
        return config.notFound()
      }

      return {
        type: "div",
        props: {
          children: [
            {
              type: "TEXT_ELEMENT",
              props: { nodeValue: "404 - Not Found", children: [] },
            },
          ],
        },
      }
    },

    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  currentRouter = router
  return router
}

export function useRouter(): Router {
  if (!currentRouter) {
    throw new Error("useRouter must be called within RouterProvider")
  }
  return currentRouter
}

export function useNavigate() {
  const router = useRouter()
  return router.navigate.bind(router)
}

export function RouterProvider(props: { router: Router }): Element {
  currentRouter = props.router
  return props.router.getCurrentComponent()
}

export function renderApp(app: () => Element, container: HTMLElement): void {
  appContainer = container
  appFunction = app
  import("./render.js").then(({ render }) => {
    render(app(), container)
  })
}

export function createRoute(
  path: string,
  component: () => Element,
): RouteConfig {
  return { path, component }
}
