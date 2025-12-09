'use client';

import * as React from 'react';

import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import { useEditorReadOnly } from 'platejs/react';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react';

import { MarkToolbarButton } from './mark-toolbar-button';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from './toolbar';

export function FixedToolbarComponent() {
  const readOnly = useEditorReadOnly();

  if (readOnly) return null;

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background">
      <Toolbar className="flex gap-1 p-1">
        {/* Turn Into Dropdown */}
        <ToolbarGroup>
          <TurnIntoToolbarButton />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Mark Buttons */}
        <ToolbarGroup>
          <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="粗体 (⌘+B)">
            <BoldIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip="斜体 (⌘+I)">
            <ItalicIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip="下划线 (⌘+U)">
            <UnderlineIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={StrikethroughPlugin.key} tooltip="删除线 (⌘+⇧+X)">
            <StrikethroughIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={CodePlugin.key} tooltip="代码 (⌘+E)">
            <CodeIcon />
          </MarkToolbarButton>
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}

// Legacy wrapper for compatibility
export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return <FixedToolbarComponent />;
}
