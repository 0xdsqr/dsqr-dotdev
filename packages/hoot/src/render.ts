import { Element } from "./types.js"

export function render(element: Element, container: HTMLElement): void {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode(element.props.nodeValue as string)
      : document.createElement(element.type)

  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      ;(dom as any)[name] = element.props[name]
    })

  element.props.children.forEach((child) => {
    render(child as Element, dom as HTMLElement)
  })

  container.appendChild(dom)
}
