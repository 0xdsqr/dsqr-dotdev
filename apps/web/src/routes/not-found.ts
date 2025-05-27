import * as hoot from "@dsqr/hoot"

function NotFoundPage() {
  const navigate = hoot.useNavigate()
  return hoot.createElement(
    "div",
    {},
    hoot.createElement("h1", {}, "404 - Page Not Found"),
    hoot.createElement(
      "p",
      {},
      "Sorry, the page you are looking for does not exist.",
    ),
    hoot.createElement(
      "button",
      {
        onclick: () => navigate("/"),
      },
      "Go Home",
    ),
  )
}

export { NotFoundPage }
