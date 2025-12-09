'use client';

import * as React from 'react';

import {
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from '@platejs/basic-nodes/react';
import { useBlockMenuState, useBlockMenu } from '@platejs/block-menu/react';
import {
  PlusIcon,
  HeadingIcon,
  ListIcon,
  QuoteIcon,
  CodeIcon,
} from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export function BlockMenuComponent() {
  const state = useBlockMenuState();
  const { props, hidden } = useBlockMenu(state);
  const editor = useEditorRef();

  if (hidden) return null;

  const insertBlock = (type: string) => {
    editor.tf.toggle.block({ type });
  };

  return (
    <div {...props} className="absolute left-0 z-50" contentEditable={false}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => insertBlock(H1Plugin.key)}>
            <HeadingIcon className="mr-2 h-4 w-4" />
            标题 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertBlock(H2Plugin.key)}>
            <HeadingIcon className="mr-2 h-4 w-4" />
            标题 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertBlock(H3Plugin.key)}>
            <HeadingIcon className="mr-2 h-4 w-4" />
            标题 3
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertBlock(BlockquotePlugin.key)}>
            <QuoteIcon className="mr-2 h-4 w-4" />
            引用
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
