/**
 * LexicalEditor Preview & Debug Component
 * 
 * This file is used to preview and debug the LexicalEditor component
 */

import LexicalEditor from './components/LexicalEditor';

export default function LexicalEditorPreview() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '20px', 
        background: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        textAlign: 'center' 
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          LexicalEditor Preview
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
          This is a preview of the LexicalEditor component with all features
        </p>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <LexicalEditor />
      </div>
    </div>
  );
}
