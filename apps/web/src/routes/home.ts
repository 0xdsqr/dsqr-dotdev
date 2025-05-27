import * as hoot from "@dsqr/hoot"

function HomePage() {
  const navigate = hoot.useNavigate()
  return hoot.createElement(
    "div",
    {},
    hoot.createElement("h1", {}, "Welcome to Our App"),
    hoot.createElement("p", {}, "This is the landing page"),
    hoot.createElement(
      "button",
      {
        onclick: () => navigate("/about"),
      },
      "Go to About Page",
    ),
    hoot.createElement("br", {}),
    hoot.createElement(
      "button",
      {
        onclick: () => navigate("/nonexistent"),
      },
      "Test 404 Page",
    ),
  )
}

export { HomePage }
