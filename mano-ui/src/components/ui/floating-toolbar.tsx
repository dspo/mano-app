'use client';

import * as React from 'react';

import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import {  useFloatingToolbar, useFloatingToolbarState } from '@platejs/floating-toolbar/react';
import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon } from 'lucide-react';

import { MarkToolbarButton } from './mark-toolbar-button';
import { Toolbar } from './toolbar';

export function FloatingToolbarComponent() {
  const state = useFloatingToolbarState();
  const { props, hidden } = useFloatingToolbar(state);

  if (hidden) return null;

  return (
    <Toolbar {...props} className="rounded-md border bg-background p-1 shadow-md">
      <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="粗体 (⌘+B)">
        <BoldIcon />
      </MarkToolbarButton>

      <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip="斜体 (⌘+I)">
        <ItalicIcon />
      </MarkToolbarButton>

      <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip="下划线 (⌘+U)">
        <UnderlineIcon />
      </MarkToolbarButton>

      <MarkToolbarButton nodeType={StrikethroughPlugin.key} tooltip="删除线">
        <StrikethroughIcon />
      </MarkToolbarButton>

      <MarkToolbarButton nodeType={CodePlugin.key} tooltip="代码">
        <CodeIcon />
      </MarkToolbarButton>
    </Toolbar>
  );
}
