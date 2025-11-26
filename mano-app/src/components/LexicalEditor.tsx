/**
 * LexicalEditor - A full-featured rich text editor component
 * Based on Lexical Playground
 */

import { GmailItem } from './model';
import LexicalEditorWithFile from './LexicalEditor/AppWithFile';
import './LexicalEditor/index.css';

export interface LexicalEditorProps {
  node?: GmailItem;
  workspace?: string;
  onClose?: () => void;
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
 * @param node - The GmailItem node containing file information
 * @param workspace - The workspace path where files are stored
 * @param onClose - Callback function when editor is closed
 * 
 * @example
 * ```tsx
 * import { LexicalEditor } from './components/LexicalEditor';
 * 
 * function MyApp() {
 *   return (
 *     <div>
 *       <LexicalEditor 
 *         node={selectedNode}
 *         workspace="/path/to/workspace"
 *         onClose={() => console.log('Editor closed')}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export default function LexicalEditor({ node, workspace, onClose, className }: LexicalEditorProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <LexicalEditorWithFile node={node} workspace={workspace} onClose={onClose} />
    </div>
  );
}

export { LexicalEditor };
