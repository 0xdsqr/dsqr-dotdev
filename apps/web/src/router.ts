import * as hoot from "@dsqr-dotdev/hoot"
import { HomePage } from "./routes/home.js"
import { AboutPage } from "./routes/about.js"
import { NotFoundPage } from "./routes/not-found.js"

const router = hoot.createRouter({
  routes: [
    hoot.createRoute("/", HomePage),
    hoot.createRoute("/about", AboutPage),
  ],
  notFound: NotFoundPage,
})

export { router }
