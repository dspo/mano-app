'use client';

import {
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from '@platejs/basic-nodes/react';
import {
  HeadingIcon,
  QuoteIcon,
  CodeIcon,
  TableIcon,
  ChevronDownIcon,
  MessageSquareIcon,
} from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

interface CommandItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: () => void;
}

export function SlashCommandElement() {
  const editor = useEditorRef();

  const commands: CommandItem[] = [
    {
      key: H1Plugin.key,
      label: '标题 1',
      icon: <HeadingIcon />,
      keywords: ['h1', 'heading1', 'title'],
      onSelect: () => {
        editor.tf.setNodes({ type: H1Plugin.key });
      },
    },
    {
      key: H2Plugin.key,
      label: '标题 2',
      icon: <HeadingIcon />,
      keywords: ['h2', 'heading2'],
      onSelect: () => {
        editor.tf.setNodes({ type: H2Plugin.key });
      },
    },
    {
      key: H3Plugin.key,
      label: '标题 3',
      icon: <HeadingIcon />,
      keywords: ['h3', 'heading3'],
      onSelect: () => {
        editor.tf.setNodes({ type: H3Plugin.key });
      },
    },
    {
      key: BlockquotePlugin.key,
      label: '引用',
      icon: <QuoteIcon />,
      keywords: ['quote', 'blockquote'],
      onSelect: () => {
        editor.tf.setNodes({ type: BlockquotePlugin.key });
      },
    },
  ];

  return (
    <InlineCombobox
      trigger="/"
      filter={(search, value) => {
        const searchLower = search.toLowerCase();
        return commands.some((command) => {
          if (command.key === value) return true;
          return (
            command.label.toLowerCase().includes(searchLower) ||
            command.keywords.some((kw) => kw.includes(searchLower))
          );
        });
      }}
    >
      <InlineComboboxInput />
      <InlineComboboxContent>
        <InlineComboboxEmpty>没有找到命令</InlineComboboxEmpty>
        <InlineComboboxGroup>
          <InlineComboboxGroupLabel>块类型</InlineComboboxGroupLabel>
          {commands.map((command) => (
            <InlineComboboxItem
              key={command.key}
              value={command.key}
              onClick={() => command.onSelect()}
            >
              {command.icon}
              <span>{command.label}</span>
            </InlineComboboxItem>
          ))}
        </InlineComboboxGroup>
      </InlineComboboxContent>
    </InlineCombobox>
  );
}

