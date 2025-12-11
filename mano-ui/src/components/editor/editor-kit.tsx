'use client';

import { TrailingBlockPlugin } from 'platejs';

import { BaseEditorKit } from './editor-base-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { CommentKit } from './plugins/comment-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DiscussionKit } from './plugins/discussion-kit';
import { DocxKit } from './plugins/docx-kit';
import { DndKit } from './plugins/dnd-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FixedToolbarKit } from './plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { SlashKit } from './plugins/slash-kit';
import { SuggestionKit } from './plugins/suggestion-kit';

// EditorKit assembled to mirror basic-nodes demo (AI removed).
export const EditorKit = [
  ...BlockMenuKit,

  // Elements / Marks / Styles
  ...BaseEditorKit,

  // Collaboration / suggestions
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing UX
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...DndKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
];
