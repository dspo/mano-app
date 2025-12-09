'use client';

import { useEffect, useRef } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';

interface PlateEditorProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  readOnly?: boolean;
}

export function PlateEditor({ value: externalValue, onChange, readOnly = false }: PlateEditorProps = {}) {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: externalValue || defaultValue,
    readOnly,
  });

  // Track if value changed externally (from another tab editing same file)
  const isInternalChange = useRef(false);
  const prevValue = useRef(externalValue);

  useEffect(() => {
    // If value changed externally (another tab editing same file), sync editor state
    if (!isInternalChange.current && prevValue.current !== externalValue) {
      editor.children = externalValue as never;
      // Trigger editor update
      if (typeof editor.onChange === 'function') {
        editor.onChange();
      }
    }
    prevValue.current = externalValue;
    isInternalChange.current = false;
  }, [externalValue, editor]);

  return (
    <div className="h-full flex flex-col bg-background">
      <Plate 
        editor={editor}
        onChange={({ value: newValue }) => {
          if (!readOnly && onChange) {
            isInternalChange.current = true;
            onChange(newValue);
          }
        }}
      >
        <EditorContainer variant="demo">
          <Editor placeholder="输入文字..." />
        </EditorContainer>
      </Plate>
    </div>
  );
}

const defaultValue = normalizeNodeId([
  {
    children: [{ text: 'Plate 富文本编辑器' }],
    type: 'h1',
  },
  {
    children: [
      { text: '这是一个功能完整的富文本编辑器，支持：' },
    ],
    type: 'p',
  },
  {
    children: [
      { text: '• 完整的工具栏（顶部固定工具栏）' },
    ],
    type: 'p',
  },
  {
    children: [
      { text: '• 浮动工具栏（选中文本时显示）' },
    ],
    type: 'p',
  },
  {
    children: [
      { text: '• 斜杠命令（输入 / 触发）' },
    ],
    type: 'p',
  },
  {
    children: [
      { text: '• 块级元素拖拽' },
    ],
    type: 'p',
  },
  {
    children: [{ text: '' }],
    type: 'p',
  },
  {
    children: [
      { text: '基础文本标记：' },
      { bold: true, text: '粗体' },
      { text: '、' },
      { italic: true, text: '斜体' },
      { text: '、' },
      { text: '下划线', underline: true },
      { text: '、' },
      { strikethrough: true, text: '删除线' },
      { text: '、' },
      { code: true, text: '代码' },
      { text: '。' },
    ],
    type: 'p',
  },
  {
    children: [{ text: '这是一个引用块示例' }],
    type: 'blockquote',
  },
  {
    children: [{ text: '' }],
    type: 'p',
  },
  {
    children: [{ text: '开始编辑吧！' }],
    type: 'p',
  },
]);
