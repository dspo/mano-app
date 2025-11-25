import clsx from "clsx";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  CreateHandler,
  CursorProps,
  DeleteHandler,
  MoveHandler,
  NodeApi,
  NodeRendererProps,
  RenameHandler,
  SimpleTree,
  Tree,
  TreeApi,
} from "react-arborist";
import { saveDataToConfig } from "@components/controller";

import { SiGmail } from "react-icons/si";
import { BsTree } from "react-icons/bs";
import { MdArrowDropDown, MdArrowRight } from "react-icons/md";
import { FaFileAlt } from "react-icons/fa";
import styles from "./Gmail.module.css";

import {
  GmailItem,
  LexicalText,
  Markdown,
  PlainText,
  RichText,
} from "@components/model";

// 导入FillFlexParent组件
import { FillFlexParent } from "@components/fill-flex-parent";
import * as icons from "react-icons/md";

interface GmailSidebarProps {
  onSelectNode: (node: GmailItem) => void;
  filename: string;
  initialData: GmailItem[];
}

let nextId = 0;

export default function GmailSidebar({ onSelectNode, filename, initialData }: GmailSidebarProps) {
  const [term] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: NodeApi<GmailItem> } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [data, setData] = useState<GmailItem[]>(initialData);
  const tree = useMemo(() => new SimpleTree<GmailItem>(data), [data]);
  const treeRef = useRef<TreeApi<GmailItem> | null>(null);

  const onMove: MoveHandler<GmailItem> = (args: {
    dragIds: string[];
    parentId: null | string;
    index: number;
  }) => {
    for (const id of args.dragIds) {
      tree.move({ id, parentId: args.parentId, index: args.index });
    }
    setData(tree.data);
  };

  const onRename: RenameHandler<GmailItem> = ({ name, id }) => {
    tree.update({ id, changes: { name } as any });
    setData(tree.data);
  };

  const onCreate: CreateHandler<GmailItem> = ({ parentId, index, type }) => {
    const data: GmailItem = {
      id: `simple-tree-id-${nextId++}`,
      name: "",
      icon: type === "leaf" ? BsTree : BsTree,
      nodeType: type === "leaf" ? "PlainText" : "Directory",
      readOnly: false
    };
    if (type === "internal") {
      (data as any).children = [];
    }
    tree.create({ parentId, index, data });
    setData(tree.data);
    return data;
  };

  const onDelete: DeleteHandler<GmailItem> = (args: { ids: string[] }) => {
    args.ids.forEach((id) => tree.drop({ id }));
    setData(tree.data);
  };

  const saveDataToLocal = () => {
    console.log("filename", filename, "data", data);
    if (filename && filename !== "") {
      saveDataToConfig(filename, data).then(() => {
        console.log("data saved")
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => { setData(initialData); }, [initialData]);
  useEffect(saveDataToLocal, [data]);

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
                  ref={treeRef}
                  data={data}
                  height={height}
                  rowHeight={28}
                  renderCursor={Cursor}
                  searchTerm={term}
                  paddingBottom={32}
                  disableEdit={(data) => data.readOnly || data.id === '__trash__'}
                  disableDrop={({ parentNode, dragNodes }) => {
                    return parentNode.data.id === "__trash__" ||
                      dragNodes.some((drag) => drag.data.id === "__trash__");
                  }}
                  onContextMenu={() => {
                    // 让节点自己处理右键事件，这里不处理
                  }}
                  onMove={onMove}
                  onCreate={onCreate}
                  onRename={onRename}
                  onDelete={onDelete}
                >
                  {(props) => <Node {...props} selectedId={selectedNodeId} onSelectNode={handleNodeSelection} setContextMenu={setContextMenu} />}
                </Tree>
              );
            }}
          </FillFlexParent>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={closeContextMenu}
              node={contextMenu.node}
              onCreate={onCreate}
              tree={tree}
              setData={setData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ContextMenu({ x, y, onClose, node, tree, setData }: {
  x: number;
  y: number;
  onClose: () => void;
  node: NodeApi<GmailItem>;
  onCreate: CreateHandler<GmailItem>;
  tree: SimpleTree<GmailItem>;
  setData: (data: GmailItem[]) => void;
}) {
  const handleCreatePlainText = () => {
    const data: GmailItem = {
      id: `simple-tree-id-${nextId++}`,
      name: "",
      icon: BsTree, // todo choose icon
      nodeType: PlainText,
      readOnly: false
    };

    tree.create({ parentId: node.data.id, index: 0, data });
    setData(tree.data);

    // 延迟一下再触发编辑，确保节点已经渲染
    setTimeout(() => {
      // 使用 tree 的 edit 方法直接编辑新节点
      node.tree.edit(data.id);
    }, 100);

    onClose();
  };

  const handleCreateRichText = () => {
    const data: GmailItem = {
      id: `simple-tree-id-${nextId++}`,
      name: "",
      icon: FaFileAlt,
      nodeType: "RichText",
      readOnly: false
    };

    tree.create({ parentId: node.data.id, index: 0, data });
    setData(tree.data);

    // 延迟一下再触发编辑，确保节点已经渲染
    setTimeout(() => {
      // 使用 tree 的 edit 方法直接编辑新节点
      node.tree.edit(data.id);
    }, 100);

    onClose();
  };

  const handleDeleteNode = () => {
    if (node.id === '__trash__') {
        return;
    }
    node.tree.delete(node.data.id);
    onClose();
  };

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
        handleCreatePlainText();
      }}>
        Create PlainText
      </div>
      <div className={styles.contextMenuItem} onClick={(e) => {
        e.stopPropagation();
        handleCreateRichText();
      }}>
        Create RichText
      </div>
      <div className={styles.contextMenuItem} onClick={(e) => {
        e.stopPropagation();
        handleDeleteNode();
      }}>
        Delete This Node
      </div>
    </div>
  );
}

function Node({ node, style, dragHandle, selectedId, onSelectNode, setContextMenu }: NodeRendererProps<GmailItem> & {
  selectedId: string | null;
  onSelectNode: (node: GmailItem) => void;
  setContextMenu: (menu: { x: number; y: number; node: NodeApi<GmailItem> } | null) => void;
}) {
  // 根据节点类型选择图标
  const getIcon = () => {
    if (node.data.icon) return node.data.icon;

    // 根据节点类型返回相应图标
    if (node.data.nodeType === RichText) {
      return FaFileAlt;
    } else if (node.data.nodeType === PlainText) {
      return BsTree;
    } else if (node.data.nodeType === Markdown) {
      return BsTree;
    } else if (node.data.nodeType === LexicalText) {
      return icons.MdTextSnippet;
    }

    return BsTree; // 默认图标
  };

  const Icon = getIcon();

  // 处理双击事件，触发编辑状态
  const handleDoubleClick = () => {
    node.edit();
  };

  // 处理右键事件
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

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
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
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
  // 获取节点名称，确保有默认值
  const name = node.data.name || "未命名";

  // 处理失焦事件
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // 失焦时提交值，使用trim处理空白，默认为"未命名"
    const value = e.currentTarget.value.trim() || "未命名";
    node.submit(value);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // 按下Escape键时取消编辑
      e.preventDefault();
      node.reset();
    } else if (e.key === "Enter") {
      // 按下Enter键时提交值
      e.preventDefault();
      const value = e.currentTarget.value.trim() || "未命名";
      node.submit(value);
    }
  };

  // 处理聚焦事件
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // 保存input元素引用，避免React事件对象重用导致的问题
    const inputElement = e.currentTarget;
    // 确保在DOM更新后选中所有文本
    setTimeout(() => {
      if (inputElement) {
        inputElement.select();
      }
    }, 0);
  };

  return (
    <input
      autoFocus
      type="text"
      defaultValue={name}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        minWidth: '100px',
        padding: '2px 4px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        fontSize: '14px'
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