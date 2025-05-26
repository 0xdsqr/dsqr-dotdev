import { Element } from "./types.js"

export function createElement(
  type: string,
  props = {},
  ...children: any[]
): Element {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map((child: any) =>
          typeof child === "object" ? child : createTextElement(child),
        ),
    },
  }
}

function createTextElement(text: string | number): Element {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
