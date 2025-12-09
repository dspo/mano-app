'use client';

import {
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from '@platejs/basic-nodes/react';
import { ParagraphPlugin } from 'platejs/react';
import {
  ChevronDownIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  PilcrowIcon,
  QuoteIcon,
} from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { ToolbarButton } from './toolbar';

const BLOCK_TYPES = [
  {
    label: '段落',
    icon: <PilcrowIcon className="h-4 w-4" />,
    value: ParagraphPlugin.key,
  },
  {
    label: '标题 1',
    icon: <Heading1Icon className="h-4 w-4" />,
    value: H1Plugin.key,
  },
  {
    label: '标题 2',
    icon: <Heading2Icon className="h-4 w-4" />,
    value: H2Plugin.key,
  },
  {
    label: '标题 3',
    icon: <Heading3Icon className="h-4 w-4" />,
    value: H3Plugin.key,
  },
  {
    label: '引用',
    icon: <QuoteIcon className="h-4 w-4" />,
    value: BlockquotePlugin.key,
  },
];

export function TurnIntoToolbarButton() {
  const editor = useEditorRef();

  const currentBlockType = useEditorSelector((editor) => {
    const entry = editor.api.block();
    return entry ? entry[0].type : ParagraphPlugin.key;
  }, []);

  const currentType = BLOCK_TYPES.find(
    (type) => type.value === currentBlockType
  ) || BLOCK_TYPES[0];

  const setBlockType = (type: string) => {
    editor.tf.setNodes({ type });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown size="sm" pressed tooltip="转换为">
          {currentType.icon}
          <span className="ml-1">{currentType.label}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {BLOCK_TYPES.map((type) => (
          <DropdownMenuItem
            key={type.value}
            onClick={() => setBlockType(type.value)}
            className="flex items-center gap-2"
          >
            {type.icon}
            {type.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

