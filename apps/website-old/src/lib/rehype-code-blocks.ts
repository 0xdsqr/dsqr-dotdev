import { visit } from 'unist-util-visit'

// Define minimal types to satisfy TypeScript
type Element = {
  type: string;
  tagName: string;
  properties: {
    className?: string[] | string;
    [key: string]: any;
  };
  children: Array<Element | any>;
};

type Root = {
  type: string;
  children: any[];
};

type Plugin = () => (tree: Root) => void;

// A simplified rehype plugin that performs basic processing on code blocks
export const rehypeCodeBlocks: Plugin = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node: any) => {
      // Only process pre elements that contain a code element
      if (
        node.tagName === 'pre' &&
        node.children.length === 1 &&
        node.children[0].type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        // Add the basic code-block class to the pre element for styling
        const classes = node.properties.className || []
        if (!Array.isArray(node.properties.className)) {
          node.properties.className = ['code-block']
        } else {
          node.properties.className = [...classes, 'code-block']
        }
      }
    })
  }
}