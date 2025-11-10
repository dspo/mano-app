import React from 'react';
import './App.css';

interface TreeNode {
  name: string;
  isDirectory: boolean;
  children?: TreeNode[];
}

// 模拟文件树数据
const mockFileTree: TreeNode[] = [
  {
    name: '第一章',
    isDirectory: true,
    children: [
      { name: '序章.md', isDirectory: false },
      { name: '第一节.md', isDirectory: false },
      { name: '第二节.md', isDirectory: false }
    ]
  },
  {
    name: '第二章',
    isDirectory: true,
    children: [
      { name: '第一节.md', isDirectory: false },
      { name: '第二节.md', isDirectory: false }
    ]
  },
  {
    name: '第三章',
    isDirectory: true,
    children: [
      { name: '第一节.md', isDirectory: false }
    ]
  },
  { name: '大纲.md', isDirectory: false },
  { name: '角色设定.md', isDirectory: false }
];

function App() {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set(['第一章', '第二章']));
  const [activeFile, setActiveFile] = React.useState<string>('序章.md');

  // 切换目录展开状态
  const toggleNode = (nodeName: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeName)) {
      newExpanded.delete(nodeName);
    } else {
      newExpanded.add(nodeName);
    }
    setExpandedNodes(newExpanded);
  };

  // 渲染文件树节点
  const renderTreeNode = (node: TreeNode, level = 0) => {
    const paddingLeft = `${level * 20}px`;
    
    return (
      <div key={node.name} className="tree-node">
        <div 
          className={`node-content ${node.isDirectory ? 'directory' : 'file'}`}
          style={{ paddingLeft }}
          onClick={() => node.isDirectory ? toggleNode(node.name) : setActiveFile(node.name)}
        >
          <span className="node-icon">
            {node.isDirectory ? (expandedNodes.has(node.name) ? '▼' : '►') : '📄'}
          </span>
          <span className={`node-name ${activeFile === node.name ? 'active' : ''}`}>
            {node.name}
          </span>
        </div>
        {node.isDirectory && expandedNodes.has(node.name) && 
          node.children?.map(child => renderTreeNode(child, level + 1))
        }
      </div>
    );
  };

  return (
    <div className="ide-layout">
      {/* 顶部菜单栏 */}
      <header className="menu-bar">
        <div className="menu-item">文件</div>
        <div className="menu-item">编辑</div>
        <div className="menu-item">视图</div>
        <div className="menu-item">帮助</div>
      </header>

      {/* 主布局 */}
      <div className="main-layout">
        {/* 左侧资源管理器 */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>资源管理器</h3>
          </div>
          <div className="file-tree">
            {mockFileTree.map(node => renderTreeNode(node))}
          </div>
        </div>

        {/* 中间编辑器 */}
        <div className="editor-container">
          <div className="editor">
            <div className="editor-header">
              <span className="file-name">{activeFile}</span>
            </div>
            <textarea 
              className="editor-content" 
              placeholder="在此处编辑内容..."
              defaultValue={`# ${activeFile}\n\n在此处开始编写您的小说内容...`}
            />
          </div>
        </div>

        {/* 右侧占位区 */}
        <div className="right-panel">
          <h3>属性面板</h3>
          <div className="panel-content">
            <p>文件: {activeFile}</p>
            <p>字符数: 0</p>
            <p>修改时间: 今天</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
