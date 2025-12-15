'use client';

import { TrailingBlockPlugin } from 'platejs';

import { AlignKit } from './plugins/align-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { CalloutKit } from './plugins/callout-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ColumnKit } from './plugins/column-kit';
import { CommentKit } from './plugins/comment-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DateKit } from './plugins/date-kit';
import { DiscussionKit } from './plugins/discussion-kit';
import { DocxKit } from './plugins/docx-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FixedToolbarKit } from './plugins/fixed-toolbar-kit';
import { FontKit } from './plugins/font-kit';
import { LineHeightKit } from './plugins/line-height-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { MarkdownKit } from './plugins/markdown-kit';
import { MathKit } from './plugins/math-kit';
import { MediaKit } from './plugins/media-kit';
import { MentionKit } from './plugins/mention-kit';
import { SlashKit } from './plugins/slash-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { TableKit } from './plugins/table-kit';
import { TocKit } from './plugins/toc-kit';
import { ToggleKit } from './plugins/toggle-kit';

const EditableBaseKit = [
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,
  ...BasicMarksKit,
  ...FontKit,
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,
  ...MarkdownKit,
];

// EditorKit assembled to mirror basic-nodes demo（React 版，可编辑模式）.
export const EditorKit = [
  ...BlockMenuKit,

  // Elements / Marks / Styles
  ...EditableBaseKit,

  // Collaboration / suggestions
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing UX
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,
];
