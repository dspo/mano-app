'use client';

import { TabbablePlugin } from '@platejs/tabbable/react';
import { KEYS } from 'platejs';

export const TabbableKit = TabbablePlugin.configure(({ editor }) => ({
  node: {
    isElement: true,
  },
  options: {
    query: () => {
      if (editor.api.isAt({ start: true }) || editor.api.isAt({ end: true }))
        return false;

      return !editor.api.some({
        match: (n) =>
          !!(() => {
            const disallow = [
              KEYS.codeBlock,
              KEYS.li,
              KEYS.listTodoClassic,
              KEYS.table,
            ] as const;
            const type = typeof n.type === 'string' ? n.type : null;
            return (type && disallow.includes(type as (typeof disallow)[number])) || n.listStyleType;
          })(),
      });
    },
  },
  override: {
    enabled: {
      indent: false,
    },
  },
}));
