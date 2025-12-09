'use client';

import { BlockMenuPlugin } from '@platejs/block-menu/react';

import { BlockMenuComponent } from '@/components/ui/block-menu';

export const BlockMenuKit = [
  BlockMenuPlugin.configure({
    render: {
      aboveNodes: BlockMenuComponent,
    },
  }),
];
