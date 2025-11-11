import './App.css';
import GmailSidebar from './components/GmailSidebar';

function App() {
  // 状态管理和文件树数据暂时简化，因为Editor组件已移除
  // 事件处理函数

  return (
    <div className="ide-layout">
      {/* 主布局 */}
      <div className="main-layout">
        {/* 左侧资源管理器 */}
        <div className="sidebar">
          <GmailSidebar />
          
          {/* 底部快速操作按钮 */}
          <div className="sidebar-footer">
            <button className="create-file-btn">新建文件</button>
          </div>
        </div>
        
        {/* 可拖拽分隔条 */}
        <div 
          className="resizer"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const sidebar = document.querySelector('.sidebar') as HTMLElement;
            const startWidth = sidebar.offsetWidth;
            const mainLayout = document.querySelector('.main-layout') as HTMLElement;
            
            // 添加视觉反馈
            sidebar.classList.add('resizing');
            mainLayout.classList.add('resizing');
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX;
              const newWidth = Math.max(220, Math.min(400, startWidth + deltaX));
              sidebar.style.width = `${newWidth}px`;
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              document.removeEventListener('mouseleave', handleMouseUp);
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
              
              // 移除视觉反馈
              sidebar.classList.remove('resizing');
              mainLayout.classList.remove('resizing');
            };
            
            // 添加额外的事件监听以增强用户体验
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mouseleave', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none'; // 防止拖动时选中文本
          }}
        ></div>

        {/* 中间编辑器区域 - Editor组件已移除 */}
        <div className="editor-container">
          <div className="editor-content-placeholder">
            <div className="placeholder-text">编辑器区域</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
