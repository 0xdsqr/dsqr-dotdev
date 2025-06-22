declare module 'prismjs' {
  const Prism: {
    languages: Record<string, any>;
    highlightAll: () => void;
    [key: string]: any;
  };
  export default Prism;
}

declare module 'prismjs/components/prism-*' {}
declare module 'prismjs/plugins/*' {}