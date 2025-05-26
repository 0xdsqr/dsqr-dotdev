export interface Element {
  type: string
  props: {
    children: Array<Element>
    [key: string]: unknown
  }
}
