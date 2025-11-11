import { useState } from 'react';
import './App.css';
import { TreeNode } from './components/types';
import GmailSidebar from './components/GmailSidebar';
import Editor from './components/Editor';

function App() {
  // 状态管理
  const [activeFile] = useState<string>('序章.md');

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
      {/* 主布局 */}
      <div className="main-layout">
        {/* 左侧资源管理器 */}
        <div className="sidebar">
          <GmailSidebar />
          
          {/* 底部快速操作按钮 */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button style={{ width: '100%', fontSize: '12px' }}>新建文件</button>
          </div>
        </div>
        
        {/* 可拖拽分隔条 */}
        <div 
          className="resizer"
          onMouseDown={(e) => {
            e.preventDefault();
            let startX = e.clientX;
            const sidebar = document.querySelector('.sidebar') as HTMLElement;
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX;
              const newWidth = Math.max(200, Math.min(400, sidebar.offsetWidth + deltaX));
              sidebar.style.width = `${newWidth}px`;
              startX = e.clientX;
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = '';
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
          }}
        ></div>

        {/* 中间编辑器 */}
        <div className="editor-container">
          <Editor 
            activeFile={activeFile}
            activeFileInfo={activeFileInfo}
          />
        </div>


      </div>
    </div>
  );
}

export default App;
