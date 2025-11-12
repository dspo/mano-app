import clsx from "clsx";
import { useState } from "react";
import {
  CursorProps,
  NodeApi,
  NodeRendererProps,
  Tree,
  useSimpleTree,
} from "react-arborist";
import { saveDataToConfig } from "@components/controller";

import { SiGmail } from "react-icons/si";
import { BsTree } from "react-icons/bs";
import { MdArrowDropDown, MdArrowRight } from "react-icons/md";
import styles from "./Gmail.module.css";

// 导入和类型声明
import { gmailData } from "@components/gmail-data";
import type { GmailItem } from "@components/model";

// 导入FillFlexParent组件
import { FillFlexParent } from "@components/fill-flex-parent";
import { useEffect } from "react";

interface GmailSidebarProps {
  onSelectNode: (node: GmailItem) => void;
}

// Workspace directory is defined in controller.ts

export default function GmailSidebar({ onSelectNode }: GmailSidebarProps) {
  const [term] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: NodeApi<GmailItem> } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [data, dataController] = useSimpleTree(gmailData);

  // Filter function is now imported from controller.ts

  useEffect(() => {
    console.log("data", data);

    // 使用controller中的保存函数
    saveDataToConfig(data);
  }, [data, saveDataToConfig]);

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

  // 处理节点选择并更新状态
  const handleNodeSelection = (node: GmailItem) => {
    setSelectedNodeId(node.id);
    onSelectNode(node);
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <div className={styles.header}>
            <SiGmail />
            <h1>Mano</h1>
          </div>
          <FillFlexParent>
            {({ height }: { width: number; height: number }) => {
              // 移除固定width，让Tree组件自动适应父容器宽度
              // 只传递height以确保垂直滚动正常工作
              return (
                <Tree
                  data={data}
                  height={height}
                  rowHeight={28}
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
                  onMove={dataController.onMove}
                  onCreate={dataController.onCreate}
                  onRename={dataController.onRename}
                  onDelete={dataController.onDelete}
                >
                  {(props) => <Node {...props} selectedId={selectedNodeId} onSelectNode={handleNodeSelection} />}
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

function Node({ node, style, dragHandle, selectedId, onSelectNode }: NodeRendererProps<GmailItem> & { selectedId: string | null; onSelectNode: (node: GmailItem) => void }) {
  const Icon = node.data.icon || BsTree;
  return (
    <div
      ref={dragHandle}
      style={style}
      className={clsx(styles.node, node.state, { [styles.selected]: selectedId === node.data.id })}
      onClick={() => {
        // 先执行节点展开/折叠
        if (node.isInternal) {
          node.toggle();
        }
        // 触发选择事件
        onSelectNode(node.data);
      }}
    >
      <FolderArrow node={node} />
      <span>
        <Icon />
      </span>
      <span>{node.isEditing ? <Input node={node} /> : node.data.name}</span>
      <span>{node.data.unread === 0 ? null : node.data.unread}</span>
      <span>{node.data.moreInfo?.length === 0 ? null : node.data.moreInfo?.join(" ")}</span>
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