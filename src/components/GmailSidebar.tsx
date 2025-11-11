import clsx from "clsx";
import { useState } from "react";
import {
  CursorProps,
  NodeApi,
  NodeRendererProps,
  Tree,
  TreeApi,
} from "react-arborist";

import { SiGmail } from "react-icons/si";
import { BsTree } from "react-icons/bs";
import { MdArrowDropDown, MdArrowRight } from "react-icons/md";
import styles from "./Gmail.module.css";

// 导入和类型声明
import { gmailData, type GmailItem } from "./gmail-data.ts";

// 导入FillFlexParent组件
import { FillFlexParent } from "./fill-flex-parent.tsx";
import { useEffect } from "react";

export default function GmailSidebar() {
  const [term] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: NodeApi<GmailItem> } | null>(null);
  const globalTree = (tree?: TreeApi<GmailItem> | null) => {
    // @ts-ignore
    window.tree = tree;
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    // 这里简单处理，实际项目中可能需要更精确的节点定位
    const nodeData = { name: "Selected Node" } as GmailItem;
    // 创建一个简单的NodeApi对象
    const node = { data: nodeData } as unknown as NodeApi<GmailItem>;
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 点击菜单外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <div className={styles.header}>
            <SiGmail />
            <h1>Mano</h1>
          </div>
          <FillFlexParent>
            {({ width, height }: { width: number; height: number }) => {
              return (
                <Tree
                  ref={globalTree}
                  initialData={gmailData}
                  width={width}
                  height={height}
                  rowHeight={32}
                  renderCursor={Cursor}
                  searchTerm={term}
                  paddingBottom={32}
                  disableEdit={(data) => data.readOnly}
                  disableDrop={({ parentNode, dragNodes }) => {
                    if (
                      parentNode.data.name === "Categories" &&
                      dragNodes.some((drag) => drag.data.name === "Inbox")
                    ) {
                      return true;
                    } else {
                      return false;
                    }
                  }}
                  onContextMenu={handleContextMenu}
                >
                  {Node}
                </Tree>
              );
            }}
          </FillFlexParent>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}

              onClose={closeContextMenu}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  return (
    <div
      className={styles.contextMenu}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
      }}
    >
      <div className={styles.contextMenuItem} onClick={(e) => {
        e.stopPropagation();
        // 这里将来实现创建文件功能
        onClose();
      }}>
        Create File In This Node
      </div>
      <div className={styles.contextMenuItem} onClick={(e) => {
        e.stopPropagation();
        // 这里将来实现删除节点功能
        onClose();
      }}>
        Delete This Node
      </div>
    </div>
  );
}

function Node({ node, style, dragHandle }: NodeRendererProps<GmailItem>) {
  const Icon = node.data.icon || BsTree;
  return (
    <div
      ref={dragHandle}
      style={style}
      className={clsx(styles.node, node.state)}
      onClick={() => node.isInternal && node.toggle()}
      // 不需要在这里添加onContextMenu，Tree组件会处理
    >
      <FolderArrow node={node} />
      <span>
        <Icon />
      </span>
      <span>{node.isEditing ? <Input node={node} /> : node.data.name}</span>
      <span>{node.data.unread === 0 ? null : node.data.unread}</span>
    </div>
  );
}

function Input({ node }: { node: NodeApi<GmailItem> }) {
  return (
    <input
      autoFocus
      type="text"
      defaultValue={node.data.name}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => node.reset()}
      onKeyDown={(e) => {
        if (e.key === "Escape") node.reset();
        if (e.key === "Enter") node.submit(e.currentTarget.value);
      }}
    />
  );
}

function FolderArrow({ node }: { node: NodeApi<GmailItem> }) {
  if (node.isLeaf) return <span></span>;
  return (
    <span>
      {node.isOpen ? <MdArrowDropDown /> : <MdArrowRight />}
    </span>
  );
}

function Cursor({ top, left }: CursorProps) {
  return <div className={styles.dropCursor} style={{ top, left }}></div>;
}