/**
 * LexicalEditor - A full-featured rich text editor component
 * Based on Lexical Playground
 */

import PlaygroundApp from './LexicalEditor/App';
import './LexicalEditor/index.css';

export interface LexicalEditorProps {
  className?: string;
}

/**
 * LexicalEditor Component
 * 
 * A complete rich text editor with all features from Lexical Playground:
 * - Rich text formatting (bold, italic, underline, strikethrough, code, subscript, superscript)
 * - Headings (h1-h6)
 * - Lists (bullet, numbered, checklist)
 * - Tables with merge/split capabilities
 * - Code blocks with syntax highlighting
 * - Images, videos (YouTube), tweets, Figma embeds
 * - Links and auto-links
 * - Mentions and hashtags
 * - Emojis and emoji picker
 * - Math equations (KaTeX)
 * - Excalidraw drawings
 * - Collapsible sections
 * - Horizontal rules
 * - Block quotes
 * - Markdown shortcuts
 * - Drag and drop
 * - Comments and collaboration
 * - History (undo/redo)
 * - And much more!
 * 
 * @example
 * ```tsx
 * import { LexicalEditor } from './components/LexicalEditor';
 * 
 * function MyApp() {
 *   return (
 *     <div>
 *       <LexicalEditor />
 *     </div>
 *   );
 * }
 * ```
 */
export default function LexicalEditor({ className }: LexicalEditorProps) {
  return (
    <div className={className}>
      <PlaygroundApp />
    </div>
  );
}

export { LexicalEditor };
