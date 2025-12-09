'use client';

import { SlashPlugin } from '@platejs/slash-command/react';

import { SlashCommandElement } from '@/components/ui/slash-command';

export const SlashKit = [
  SlashPlugin.configure({
    options: {
      query: (editor) => {
        const entry = editor.api.getEntry();
        if (!entry) return '';
        
        const [node] = entry;
        if (node.type !== 'p') return '';
        
        const text = node.children.map((n: any) => n.text || '').join('');
        return text.startsWith('/') ? text.slice(1) : '';
      },
    },
    render: {
      afterEditable: SlashCommandElement,
    },
  }),
];
