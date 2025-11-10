import { useState } from 'react';
import './App.css';

interface TreeNode {
  id?: string;
  name: string;
  isDirectory: boolean;
  type: 'file' | 'folder';
  children?: TreeNode[];
  icon?: string;
}

function App() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['第一章', '第二章']));
  const [activeFile, setActiveFile] = useState<string>('序章.md');
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);

  // 模拟文件树数据 - 添加更丰富的文件类型和图标
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
    const paddingLeft = `${level * 24}px`;
    const isActiveFile = !node.isDirectory && activeFile === node.name;
    
    return (
      <div key={node.id || node.name} className="tree-node">
        <div 
          className={`node-content ${node.isDirectory ? 'directory' : 'file'} ${isActiveFile ? 'active' : ''}`}
          style={{ paddingLeft }}
          onClick={() => node.isDirectory ? toggleNode(node.name) : setActiveFile(node.name)}
        >
          <span className="node-icon">
            {node.isDirectory ? (expandedNodes.has(node.name) ? '▼' : '►') : node.icon || '📄'}
          </span>
          <span className={`node-name ${isActiveFile ? 'active' : ''}`}>
            {node.name}
          </span>
        </div>
        {node.isDirectory && expandedNodes.has(node.name) && 
          node.children?.map(child => renderTreeNode(child, level + 1))
        }
      </div>
    );
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
      <div className="menu-bar">
        <div className="menu-item">文件</div>
        <div className="menu-item">编辑</div>
        <div className="menu-item">视图</div>
        <div className="menu-item">项目</div>
        <div className="menu-item">工具</div>
        <div className="menu-item">帮助</div>
        
        {/* 搜索按钮 */}
        <div className="menu-item" style={{ marginLeft: 'auto', padding: '6px' }}>
          <button 
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            {showSearchPanel ? '关闭搜索' : '搜索'}
          </button>
        </div>
      </div>

      {/* 主布局 */}
      <div className="main-layout">
        {/* 左侧资源管理器 */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>文件浏览器</h3>
          </div>
          <div className="file-tree">
            {mockFileTree.map(node => renderTreeNode(node))}
          </div>
          
          {/* 底部快速操作按钮 */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button style={{ width: '100%', fontSize: '12px' }}>新建文件</button>
          </div>
        </div>

        {/* 中间编辑器 */}
        <div className="editor-container">
          <div className="editor">
            <div className="editor-header">
              <span className="file-name">
                {activeFileInfo?.icon} {activeFile}
              </span>
              {showSearchPanel && (
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="搜索内容..." 
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px',
                      width: '200px'
                    }}
                  />
                </div>
              )}
            </div>
            <textarea 
              className="editor-content" 
              placeholder="在此处编辑内容..."
              defaultValue={`# ${activeFile}\n\n在此处开始编写您的小说内容...`}
            />
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="right-panel">
          <h3>文档信息</h3>
          <div className="panel-content">
            {activeFileInfo && (
              <>
                <p>文件名: {activeFileInfo.name}</p>
                <p>类型: {activeFileInfo.type === 'file' ? '文本文件' : '文件夹'}</p>
                <p>修改日期: 今天</p>
                <p>字数: 0</p>
              </>
            )}
            
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>文档设置</h4>
              <div style={{ fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" defaultChecked={false} /> 自动保存
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked={true} /> 拼写检查
                  </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
