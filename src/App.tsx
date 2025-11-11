import { useState } from 'react';
import './App.css';
import { TreeNode } from './components/types';
import MenuBar from './components/MenuBar';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import PropertyPanel from './components/PropertyPanel';

function App() {
  // 状态管理
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['第一章', '第二章']));
  const [activeFile, setActiveFile] = useState<string>('序章.md');
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);

  // 模拟文件树数据
  const mockFileTree: TreeNode[] = [
    {
      id: 'chapter1',
      name: '第一章',
      isDirectory: true,
      type: 'folder',
      icon: '📁',
      children: [
        { id: 'prologue', name: '序章.md', isDirectory: false, type: 'file', icon: '📝' },
        { id: 'section1-1', name: '第一节.md', isDirectory: false, type: 'file', icon: '📄' },
        { id: 'section1-2', name: '第二节.md', isDirectory: false, type: 'file', icon: '📄' }
      ]
    },
    {
      id: 'chapter2',
      name: '第二章',
      isDirectory: true,
      type: 'folder',
      icon: '📁',
      children: [
        { id: 'section2-1', name: '第一节.md', isDirectory: false, type: 'file', icon: '📄' },
        { id: 'section2-2', name: '第二节.md', isDirectory: false, type: 'file', icon: '📄' }
      ]
    },
    {
      id: 'chapter3',
      name: '第三章',
      isDirectory: true,
      type: 'folder',
      icon: '📁',
      children: [
        { id: 'section3-1', name: '第一节.md', isDirectory: false, type: 'file', icon: '📄' }
      ]
    },
    { id: 'outline', name: '大纲.md', isDirectory: false, type: 'file', icon: '📋' },
    { id: 'characters', name: '角色设定.md', isDirectory: false, type: 'file', icon: '👥' }
  ];

  // 事件处理函数
  const toggleNode = (nodeName: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeName)) {
      newExpanded.delete(nodeName);
    } else {
      newExpanded.add(nodeName);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectFile = (fileName: string) => {
    setActiveFile(fileName);
  };

  const handleToggleSearch = () => {
    setShowSearchPanel(!showSearchPanel);
  };

  // 获取当前活动文件的详细信息
  const getActiveFileInfo = () => {
    const findNode = (nodes: TreeNode[]): TreeNode | undefined => {
      for (const node of nodes) {
        if (node.name === activeFile) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findNode(mockFileTree);
  };

  const activeFileInfo = getActiveFileInfo();

  return (
    <div className="ide-layout">
      {/* 顶部菜单栏 */}
      <MenuBar 
        showSearchPanel={showSearchPanel} 
        onToggleSearch={handleToggleSearch} 
      />

      {/* 主布局 */}
      <div className="main-layout">
        {/* 左侧资源管理器 */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>文件浏览器</h3>
          </div>
          <FileTree 
            fileTree={mockFileTree}
            expandedNodes={expandedNodes}
            activeFile={activeFile}
            onToggleNode={toggleNode}
            onSelectFile={handleSelectFile}
          />
          
          {/* 底部快速操作按钮 */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button style={{ width: '100%', fontSize: '12px' }}>新建文件</button>
          </div>
        </div>

        {/* 中间编辑器 */}
        <div className="editor-container">
          <Editor 
            activeFile={activeFile}
            activeFileInfo={activeFileInfo}
            showSearchPanel={showSearchPanel}
          />
        </div>

        {/* 右侧属性面板 */}
        <PropertyPanel activeFileInfo={activeFileInfo} />
      </div>
    </div>
  );
}

export default App;
