// 共享类型定义
export interface TreeNode {
  id?: string;
  name: string;
  isDirectory: boolean;
  type: 'file' | 'folder';
  children?: TreeNode[];
  icon?: string;
}

// 组件Props类型
export interface FileTreeProps {
  fileTree: TreeNode[];
  expandedNodes: Set<string>;
  activeFile: string;
  onToggleNode: (nodeName: string) => void;
  onSelectFile: (fileName: string) => void;
}

export interface MenuBarProps {
  showSearchPanel: boolean;
  onToggleSearch: () => void;
}

// EditorProps接口已移除，因为Editor组件已删除