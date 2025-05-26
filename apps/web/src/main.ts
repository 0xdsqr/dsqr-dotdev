import * as hoot from "@dsqr-dotdev/hoot"
import { router } from "./router.js"

function App() {
  return hoot.createElement(
    "div",
    { style: "padding: 20px; font-family: Arial, sans-serif;" },
    hoot.RouterProvider({ router }),
  )
}

const container = document.getElementById("app")
if (!container) {
  throw new Error("Could not find #app element")
}

hoot.renderApp(App, container)
;(window as any).router = router
console.log("bing bong router is working", router.getCurrentComponent)
