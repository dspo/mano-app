'use client';

import { memo, useMemo, useState } from 'react';

import { GripVertical } from 'lucide-react';
import { expandListItemsWithChildren } from '@platejs/list';
import { useDraggable, useDropLine } from '@platejs/dnd';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { type TElement, isType, KEYS } from 'platejs';
import {
  type PlateElementProps,
  type RenderNodeWrapper,
  MemoizedChildren,
  useEditorRef,
  useElement,
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const UNDRAGGABLE_KEYS = [KEYS.column, KEYS.tr, KEYS.td];

/**
 * 还原块拖拽功能，使用 BlockSelection + DnD，带左侧拖拽手柄。
 */
export const BlockDraggable: RenderNodeWrapper = (props) => {
  const { editor, element, path } = props;

  const enabled = useMemo(() => {
    if (editor.dom.readOnly) return false;
    if (path.length === 1 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      return true;
    }
    return false;
  }, [editor, element, path]);

  if (!enabled) return;

  return (nodeProps) => (
    <DraggableBlock
      {...nodeProps}
      element={element}
      path={path}
      editor={editor}
    />
  );
};

function DraggableBlock(props: PlateElementProps & { path: number[] }) {
  const { children, editor, element, path } = props;
  const blockSelectionApi = editor.getApi(BlockSelectionPlugin)?.blockSelection;

  const { isDragging, nodeRef, previewRef, handleRef } = useDraggable({
    element,
    onDropHandler: (_, { dragItem }) => {
      const id = (dragItem as { id: string[] | string }).id;
      blockSelectionApi?.add(id);
      resetPreview();
    },
  });

  const [previewTop, setPreviewTop] = useState(0);

  const resetPreview = () => {
    if (previewRef.current) {
      previewRef.current.replaceChildren();
      previewRef.current?.classList.add('hidden');
    }
  };

  return (
    <div className={cn('relative', isDragging && 'opacity-50')}
      onMouseEnter={() => {
        setPreviewTop(calcDragButtonTop(editor, element));
      }}
    >
      <Gutter>
        <Button
          ref={handleRef}
          variant="ghost"
          className="left-0 absolute h-6 w-6 p-0"
          style={{ top: `${previewTop}px` }}
          data-plate-prevent-deselect
        >
          <DragHandle
            isDragging={isDragging}
            previewRef={previewRef}
            resetPreview={resetPreview}
            setPreviewTop={setPreviewTop}
          />
        </Button>
      </Gutter>

      <div
        ref={previewRef}
        className={cn('left-0 absolute hidden w-full')}
        style={{ top: `${-previewTop}px` }}
        contentEditable={false}
      />

      <div
        ref={nodeRef}
        className="slate-blockWrapper flow-root"
      >
        <MemoizedChildren>{children}</MemoizedChildren>
        <DropLine />
      </div>
    </div>
  );
}

function Gutter({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'slate-gutterLeft',
        '-translate-x-full absolute top-0 z-50 flex h-full cursor-text'
      )}
      contentEditable={false}
    >
      {children}
    </div>
  );
}

const DragHandle = memo(function DragHandle({
  isDragging,
  previewRef,
  resetPreview,
  setPreviewTop,
}: {
  isDragging: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
  resetPreview: () => void;
  setPreviewTop: (top: number) => void;
}) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex size-full items-center justify-center"
          onMouseDown={(e) => {
            resetPreview();
            if ((e.button !== 0 && e.button !== 2) || e.shiftKey) return;

            const selectionNodes =
              editor
                .getApi(BlockSelectionPlugin)
                ?.blockSelection.getNodes({ sort: true }) ??
              editor.api.blocks({ mode: 'highest' });

            const blocks = expandListItemsWithChildren(editor, selectionNodes).map(
              ([node]) => node
            );

            if (selectionNodes.length === 0) {
              editor.tf.blur();
              editor.tf.collapse();
            }

            const elements = createDragPreviewElements(editor, blocks);
            previewRef.current?.append(...elements);
            previewRef.current?.classList.remove('hidden');
            previewRef.current?.classList.add('opacity-0');
          }}
          onMouseEnter={() => {
            if (isDragging) return;
            setPreviewTop(calcDragButtonTop(editor, element));
          }}
          onMouseUp={resetPreview}
          data-plate-prevent-deselect
          role="button"
        >
          <GripVertical className="text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>Drag to move</TooltipContent>
    </Tooltip>
  );
});

const DropLine = memo(function DropLine({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { dropLine } = useDropLine();
  if (!dropLine) return null;
  return (
    <div
      {...props}
      className={cn(
        'slate-dropLine',
        'absolute inset-x-0 h-0.5 opacity-100 transition-opacity',
        'bg-brand/50',
        dropLine === 'top' && '-top-px',
        dropLine === 'bottom' && '-bottom-px',
        className
      )}
    />
  );
});

const createDragPreviewElements = (
  editor: any,
  blocks: TElement[]
): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  blocks.forEach((node) => {
    const domNode = editor.api.toDOMNode(node)!;
    const newDomNode = domNode.cloneNode(true) as HTMLElement;
    elements.push(newDomNode);
  });
  return elements;
};

const calcDragButtonTop = (editor: any, element: TElement): number => {
  const child = editor.api.toDOMNode(element)!;
  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace('px', ''));
  return currentMarginTop;
};
