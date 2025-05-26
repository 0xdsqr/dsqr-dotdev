import * as hoot from "@dsqr-dotdev/hoot"

function AboutPage() {
  const navigate = hoot.useNavigate()
  return hoot.createElement(
    "div",
    {},
    hoot.createElement("h1", {}, "About Us"),
    hoot.createElement("p", {}, "Hello world from the about page!"),
    hoot.createElement(
      "button",
      {
        onclick: () => navigate("/"),
      },
      "Back to Home",
    ),
  )
}

export { AboutPage }
