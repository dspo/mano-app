import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LexicalEditorPreview from './LexicalEditorPreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LexicalEditorPreview />
  </StrictMode>,
);
