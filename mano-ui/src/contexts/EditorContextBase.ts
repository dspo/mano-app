import { createContext } from 'react';
import type { Dispatch } from 'react';

import type { EditorAction, EditorState } from '@/types/editor';

export interface EditorContextValue {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}

export const EditorContext = createContext<EditorContextValue | null>(null)
