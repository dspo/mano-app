'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DndKit } from './plugins/dnd-kit';
import { FixedToolbarKit } from './plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { MarkdownKit } from './plugins/markdown-kit';

export const EditorKit = [
  // Elements
  ...BasicBlocksKit,

  // Marks
  ...BasicMarksKit,

  // Editing
  ...CursorOverlayKit,
  ...DndKit,
  BlockSelectionPlugin,
  TrailingBlockPlugin,

  // Parsers
  ...MarkdownKit,

  // UI
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
];

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();


