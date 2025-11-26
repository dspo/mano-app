import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "@/App"

if (import.meta.env.DEV && typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  let reported = false;

  const describe = (node: Node | null) => {
    if (!node) {
      return 'null';
    }
    if (node instanceof Element) {
      const tag = node.tagName.toLowerCase();
      const id = node.id ? `#${node.id}` : '';
      const cls = node.className ? `.${node.className}` : '';
      return `${tag}${id}${cls}`;
    }
    return node.nodeName;
  };

  const snapshotHTML = (node: Node | null) => {
    if (node && node instanceof Element) {
      const html = node.outerHTML || node.innerHTML || '';
      return html.slice(0, 200);
    }
    return null;
  };

  Node.prototype.removeChild = function patchedRemoveChild<T extends Node>(
    child: T,
  ): T {
    try {
      return originalRemoveChild.call(this, child);
    } catch (error) {
      if (!reported) {
        reported = true;
        console.error('[removeChild mismatch]', {
          parent: describe(this),
          child: describe(child),
          parentHTML: snapshotHTML(this),
          childHTML: snapshotHTML(child),
          stack: new Error('removeChild trace').stack,
          originalError: error,
        });
      }
      throw error;
    }
  };
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
