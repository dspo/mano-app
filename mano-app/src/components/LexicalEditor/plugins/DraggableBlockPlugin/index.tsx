/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {
  DragEvent as ReactDragEvent,
  JSX,
  ReactNode,
  ReactPortal,
} from 'react';

import './index.css';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {eventFiles} from '@lexical/rich-text';
import {calculateZoomLevel, isHTMLElement, mergeRegister} from '@lexical/utils';
import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  type LexicalEditor,
  type NodeKey,
} from 'lexical';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {createPortal} from 'react-dom';

import {getPortalRoot} from '../../utils/portalRoot';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';
const SPACE = 4;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';
const TEXT_BOX_HORIZONTAL_PADDING = 28;
const Downward = 1;
const Upward = -1;
const Indeterminate = 0;
let prevIndex = Infinity;

class Point {
  constructor(private _x: number, private _y: number) {}

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  calcDeltaXTo({x}: {x: number}): number {
    return this.x - x;
  }

  calcDeltaYTo({y}: {y: number}): number {
    return this.y - y;
  }
}

class Rectangle {
  private _left: number;
  private _top: number;
  private _right: number;
  private _bottom: number;

  constructor(left: number, top: number, right: number, bottom: number) {
    const [physicTop, physicBottom] = top <= bottom ? [top, bottom] : [bottom, top];
    const [physicLeft, physicRight] = left <= right ? [left, right] : [right, left];
    this._top = physicTop;
    this._right = physicRight;
    this._left = physicLeft;
    this._bottom = physicBottom;
  }

  get top(): number {
    return this._top;
  }

  get right(): number {
    return this._right;
  }

  get bottom(): number {
    return this._bottom;
  }

  get left(): number {
    return this._left;
  }

  get width(): number {
    return Math.abs(this._left - this._right);
  }

  get height(): number {
    return Math.abs(this._bottom - this._top);
  }

  contains(target: Rectangle | Point): {
    result: boolean;
    reason: {isOnBottomSide: boolean; isOnLeftSide: boolean; isOnRightSide: boolean; isOnTopSide: boolean};
  } {
    if (target instanceof Point) {
      const {x, y} = target;
      const isOnTopSide = y < this._top;
      const isOnBottomSide = y > this._bottom;
      const isOnLeftSide = x < this._left;
      const isOnRightSide = x > this._right;
      return {
        result: !(isOnTopSide || isOnBottomSide || isOnLeftSide || isOnRightSide),
        reason: {isOnBottomSide, isOnLeftSide, isOnRightSide, isOnTopSide},
      };
    }
    const {top, left, bottom, right} = target;
    return {
      result:
        top >= this._top &&
        top <= this._bottom &&
        bottom >= this._top &&
        bottom <= this._bottom &&
        left >= this._left &&
        left <= this._right &&
        right >= this._left &&
        right <= this._right,
      reason: {isOnBottomSide: false, isOnLeftSide: false, isOnRightSide: false, isOnTopSide: false},
    };
  }

  generateNewRect({
    left = this.left,
    top = this.top,
    right = this.right,
    bottom = this.bottom,
  }: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  }): Rectangle {
    return new Rectangle(left, top, right, bottom);
  }

  static fromDOM(dom: HTMLElement): Rectangle {
    const {top, width, left, height} = dom.getBoundingClientRect();
    return Rectangle.fromLWTH(left, width, top, height);
  }

  static fromLWTH(left: number, width: number, top: number, height: number): Rectangle {
    return new Rectangle(left, top, left + width, top + height);
  }
}

function getCurrentIndex(keysLength: number): number {
  if (keysLength === 0) {
    return Infinity;
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }
  return Math.floor(keysLength / 2);
}

function getTopLevelNodeKeys(editor: LexicalEditor): Array<NodeKey> {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}

function getCollapsedMargins(elem: HTMLElement): {marginBottom: number; marginTop: number} {
  const getMargin = (element: Element | null | undefined, margin: 'marginBottom' | 'marginTop') => {
    return element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;
  };
  const {marginTop, marginBottom} = window.getComputedStyle(elem);
  const prev = getMargin(elem.previousElementSibling, 'marginBottom');
  const next = getMargin(elem.nextElementSibling, 'marginTop');
  return {
    marginBottom: Math.max(parseFloat(marginBottom), next),
    marginTop: Math.max(parseFloat(marginTop), prev),
  };
}

function getBlockElement(
  anchorElem: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false,
): HTMLElement | null {
  const anchorRect = anchorElem.getBoundingClientRect();
  const topLevelNodeKeys = getTopLevelNodeKeys(editor);
  let blockElem: HTMLElement | null = null;
  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const first = editor.getElementByKey(topLevelNodeKeys[0]);
      const last = editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1]);
      const firstRect = first?.getBoundingClientRect();
      const lastRect = last?.getBoundingClientRect();
      if (first && last && firstRect && lastRect) {
        if (event.y / calculateZoomLevel(first) < firstRect.top) {
          blockElem = first;
          return;
        }
        if (event.y / calculateZoomLevel(last) > lastRect.bottom) {
          blockElem = last;
          return;
        }
      }
    }

    let index = getCurrentIndex(topLevelNodeKeys.length);
    let direction = Indeterminate;
    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index];
      const elem = editor.getElementByKey(key);
      if (!elem) {
        break;
      }

      const zoom = calculateZoomLevel(elem);
      const point = new Point(event.x / zoom, event.y / zoom);
      const domRect = Rectangle.fromDOM(elem);
      const {marginTop, marginBottom} = getCollapsedMargins(elem);
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorRect.left,
        right: anchorRect.right,
        top: domRect.top - marginTop,
      });
      const {
        result,
        reason: {isOnTopSide, isOnBottomSide},
      } = rect.contains(point);

      if (result) {
        blockElem = elem;
        prevIndex = index;
        break;
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward;
        } else if (isOnBottomSide) {
          direction = Downward;
        } else {
          direction = Infinity;
        }
      }

      index += direction;
    }
  });
  return blockElem;
}

function setMenuPosition(targetElem: HTMLElement | null, floatingElem: HTMLElement, anchorElem: HTMLElement): void {
  if (!targetElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const targetRect = targetElem.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElem);
  const floatingRect = floatingElem.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();

  let targetHeight = parseInt(targetStyle.lineHeight, 10);
  if (Number.isNaN(targetHeight)) {
    targetHeight = targetRect.bottom - targetRect.top;
  }

  const top =
    targetRect.top + (targetHeight - floatingRect.height) / 2 - anchorRect.top + anchorElem.scrollTop;
  const left = SPACE;

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

function setDragImage(dataTransfer: DataTransfer, draggableBlockElem: HTMLElement): void {
  const {transform} = draggableBlockElem.style;
  draggableBlockElem.style.transform = 'translateZ(0)';
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);
  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
}

function setTargetLine(
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  mouseY: number,
  anchorElem: HTMLElement,
): void {
  const {top, height} = targetBlockElem.getBoundingClientRect();
  const {top: anchorTop, width: anchorWidth} = anchorElem.getBoundingClientRect();
  const {marginTop, marginBottom} = getCollapsedMargins(targetBlockElem);

  let lineTop = top;
  if (mouseY >= top) {
    lineTop += height + marginBottom / 2;
  } else {
    lineTop -= marginTop / 2;
  }

  const translatedTop = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT + anchorElem.scrollTop;
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;

  targetLineElem.style.transform = `translate(${left}px, ${translatedTop}px)`;
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2}px`;
  targetLineElem.style.opacity = '.4';
}

function hideTargetLine(targetLineElem: HTMLElement | null): void {
  if (!targetLineElem) {
    return;
  }
  targetLineElem.style.opacity = '0';
  targetLineElem.style.transform = 'translate(-10000px, -10000px)';
}

function useDraggableBlockMenu(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  menuRef: React.RefObject<HTMLDivElement | null>,
  targetLineRef: React.RefObject<HTMLDivElement | null>,
  isEditable: boolean,
  menuComponent: ReactNode,
  targetLineComponent: ReactNode,
  isOnMenu: (element: HTMLElement) => boolean,
  onElementChanged: ((element: HTMLElement | null) => void) | undefined,
  portalContainer: HTMLElement,
): ReactPortal {
  const scrollerElem = anchorElem.parentElement;
  const isDraggingBlockRef = useRef(false);
  const [draggableBlockElem, setDraggableBlockElemState] = useState<HTMLElement | null>(null);
  const setDraggableBlockElem = useCallback(
    (elem: HTMLElement | null) => {
      setDraggableBlockElemState(elem);
      onElementChanged?.(elem);
    },
    [onElementChanged],
  );

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      const target = event.target;
      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null);
        return;
      }
      if (isOnMenu(target)) {
        return;
      }
      const elem = getBlockElement(anchorElem, editor, event);
      setDraggableBlockElem(elem);
    }

    function onMouseLeave() {
      setDraggableBlockElem(null);
    }

    if (scrollerElem) {
      scrollerElem.addEventListener('mousemove', onMouseMove);
      scrollerElem.addEventListener('mouseleave', onMouseLeave);
    }
    return () => {
      if (scrollerElem) {
        scrollerElem.removeEventListener('mousemove', onMouseMove);
        scrollerElem.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [scrollerElem, anchorElem, editor, isOnMenu, setDraggableBlockElem]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem);
    }
  }, [anchorElem, draggableBlockElem, menuRef]);

  useEffect(() => {
    function onDragover(event: DragEvent): boolean {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const {pageY, target} = event;
      if (!isHTMLElement(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      const targetLineElem = targetLineRef.current;
      if (!targetBlockElem || !targetLineElem) {
        return false;
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY / calculateZoomLevel(target), anchorElem);
      event.preventDefault();
      return true;
    }

    function onDrop(event: DragEvent): boolean {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const {target, dataTransfer, pageY} = event;
      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) ?? '';
      const draggedNode = $getNodeByKey(dragData);
      if (!draggedNode || !isHTMLElement(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      if (!targetBlockElem) {
        return false;
      }
      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem);
      if (!targetNode || targetNode === draggedNode) {
        return !!targetNode;
      }
      const targetBlockTop = targetBlockElem.getBoundingClientRect().top;
      if (pageY / calculateZoomLevel(target) >= targetBlockTop) {
        targetNode.insertAfter(draggedNode);
      } else {
        targetNode.insertBefore(draggedNode);
      }
      setDraggableBlockElem(null);
      return true;
    }

    return mergeRegister(
      editor.registerCommand(DRAGOVER_COMMAND, onDragover, COMMAND_PRIORITY_LOW),
      editor.registerCommand(DROP_COMMAND, onDrop, COMMAND_PRIORITY_HIGH),
    );
  }, [anchorElem, editor, targetLineRef, setDraggableBlockElem]);

  const onDragStart = useCallback(
    (event: ReactDragEvent) => {
      const dataTransfer = event.dataTransfer;
      if (!dataTransfer || !draggableBlockElem) {
        return;
      }
      setDragImage(dataTransfer, draggableBlockElem);
      let nodeKey = '';
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(draggableBlockElem);
        if (node) {
          nodeKey = node.getKey();
        }
      });
      isDraggingBlockRef.current = true;
      dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
    },
    [draggableBlockElem, editor],
  );

  const onDragEnd = useCallback(() => {
    isDraggingBlockRef.current = false;
    hideTargetLine(targetLineRef.current);
  }, [targetLineRef]);

  return createPortal(
    <>
      <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {isEditable && menuComponent}
      </div>
      {targetLineComponent}
    </>,
    portalContainer,
  );
}

type PatchedPluginProps = {
  anchorElem?: HTMLElement;
  menuRef: React.RefObject<HTMLDivElement | null>;
  targetLineRef: React.RefObject<HTMLDivElement | null>;
  menuComponent: ReactNode;
  targetLineComponent: ReactNode;
  isOnMenu: (element: HTMLElement) => boolean;
  onElementChanged?: (element: HTMLElement | null) => void;
  portalContainer?: HTMLElement;
};

function DraggableBlockPluginPatched({
  anchorElem = document.body,
  portalContainer = document.body,
  menuRef,
  targetLineRef,
  menuComponent,
  targetLineComponent,
  isOnMenu,
  onElementChanged,
}: PatchedPluginProps): ReactPortal {
  const [editor] = useLexicalComposerContext();
  return useDraggableBlockMenu(
    editor,
    anchorElem,
    menuRef,
    targetLineRef,
    editor._editable,
    menuComponent,
    targetLineComponent,
    isOnMenu,
    onElementChanged,
    portalContainer,
  );
}

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function DraggableBlockPlugin({
  anchorElem = getPortalRoot(),
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null,
  );

  function insertBlock(e: React.MouseEvent) {
    if (!draggableElement || !editor) {
      return;
    }

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableElement);
      if (!node) {
        return;
      }

      const pNode = $createParagraphNode();
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }
      pNode.select();
    });
  }

  const portalContainer = useMemo(() => getPortalRoot(), []);

  return (
    <DraggableBlockPluginPatched
      anchorElem={anchorElem}
      portalContainer={portalContainer}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className="icon draggable-block-menu">
          <button
            title="Click to add below"
            className="icon icon-plus"
            onClick={insertBlock}
          />
          <div className="icon" />
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
      onElementChanged={setDraggableElement}
    />
  );
}
