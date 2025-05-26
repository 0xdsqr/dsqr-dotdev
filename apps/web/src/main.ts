import * as hoot from "@dsqr-dotdev/hoot"

function HomePage() {
  const navigate = hoot.useNavigate()
  return hoot.createElement('div', {},
    hoot.createElement('h1', {}, 'Welcome to Our App'),
    hoot.createElement('p', {}, 'This is the landing page'),
    hoot.createElement('button', {
      onclick: () => navigate('/about')
    }, 'Go to About Page'),
    hoot.createElement('br', {}),
    hoot.createElement('button', {
      onclick: () => navigate('/nonexistent')
    }, 'Test 404 Page')
  )
}

function AboutPage() {
  const navigate = hoot.useNavigate()
  return hoot.createElement('div', {},
    hoot.createElement('h1', {}, 'About Us'),
    hoot.createElement('p', {}, 'Hello world from the about page!'),
    hoot.createElement('button', {
      onclick: () => navigate('/')
    }, 'Back to Home')
  )
}

function NotFoundPage() {
  const navigate = hoot.useNavigate()
  return hoot.createElement('div', {},
    hoot.createElement('h1', {}, '404 - Page Not Found'),
    hoot.createElement('p', {}, 'Sorry, the page you are looking for does not exist.'),
    hoot.createElement('button', {
      onclick: () => navigate('/')
    }, 'Go Home')
  )
}

const router = hoot.createRouter({
  routes: [
    hoot.createRoute('/', HomePage),
    hoot.createRoute('/about', AboutPage)
  ],
  notFound: NotFoundPage
})

function App() {
  return hoot.createElement('div', { style: 'padding: 20px; font-family: Arial, sans-serif;' },
    hoot.RouterProvider({ router })
  )
}

const container = document.getElementById('app')
if (!container) {
  throw new Error('Could not find #app element')
}

hoot.renderApp(App, container)

;(window as any).router = router
console.log("bing bong router is working", router.getCurrentComponent)