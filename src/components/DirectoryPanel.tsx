import React, { useState, useRef } from 'react';
import type { GmailItem } from '@components/model';

interface DirectoryPanelProps {
  node: GmailItem;
  onClose: () => void;
}

/**
 * DirectoryPanel component for displaying directory content with drag, resize, maximize and window functionality
 */
const DirectoryPanel = ({ node, onClose }: DirectoryPanelProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWindowed, setIsWindowed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: '100%', height: '100%' });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const isDragging = useRef(false);
  const initialDimensions = useRef({ width: '100%', height: '100%' });
  const initialPosition = useRef({ x: 0, y: 0 });

  // 处理最大化/还原
  const handleMaximize = () => {
    if (!isMaximized) {
      // 保存当前尺寸
      if (editorRef.current) {
        initialDimensions.current = {
          width: editorRef.current.style.width || '100%',
          height: editorRef.current.style.height || '100%'
        };
      }
      setDimensions({ width: '100%', height: '100%' });
      setIsWindowed(false); // 最大化时取消窗口化状态
    } else {
      // 还原到之前的尺寸
      setDimensions(initialDimensions.current);
    }
    setIsMaximized(!isMaximized);
  };

  // 处理窗口化
  const handleWindow = () => {
    if (!isWindowed) {
      // 保存当前尺寸和位置
      if (editorRef.current) {
        initialDimensions.current = {
          width: editorRef.current.style.width || '100%',
          height: editorRef.current.style.height || '100%'
        };
        initialPosition.current = { ...position };
      }
      // 设置为窗口化尺寸（略微缩小）
      if (editorRef.current && editorRef.current.parentElement) {
        const parentWidth = editorRef.current.parentElement.offsetWidth;
        const parentHeight = editorRef.current.parentElement.offsetHeight;
        setDimensions({
          width: `${parentWidth * 0.9}px`,
          height: `${parentHeight * 0.9}px`
        });
        // 居中显示
        setPosition({
          x: parentWidth * 0.05,
          y: parentHeight * 0.05
        });
      }
      setIsMaximized(false); // 窗口化时取消最大化状态
    } else {
      // 还原到之前的尺寸和位置
      setDimensions(initialDimensions.current);
      setPosition(initialPosition.current);
    }
    setIsWindowed(!isWindowed);
  };

  // 开始拖拽
  const startDrag = (e: React.MouseEvent) => {
    // 只有在窗口化状态下可以拖拽
    if (!isWindowed || isMaximized) return;

    e.preventDefault();
    isDragging.current = true;
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startY = e.clientY;
    const currentX = position.x;
    const currentY = position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !editorRef.current || !editorRef.current.parentElement) return;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // 计算新位置并限制在父容器内
      const parentRect = editorRef.current.parentElement.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      const newX = Math.max(0, Math.min(parentRect.width - editorRect.width, currentX + deltaX));
      const newY = Math.max(0, Math.min(parentRect.height - editorRect.height, currentY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;

      isDragging.current = false;
      document.body.style.userSelect = '';

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);

      if (editorRef.current) {
        document.body.style.cursor = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);

    if (editorRef.current) {
      document.body.style.cursor = 'move';
    }
  };

  // 开始调整大小
  const startResize = (e: React.MouseEvent, direction: string) => {
    if (!isWindowed || isMaximized) return;

    e.preventDefault();
    isResizing.current = true;
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startY = e.clientY;

    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const startWidth = rect.width;
      const startHeight = rect.height;
      const startLeft = rect.left;
      const startTop = rect.top;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current || !editorRef.current || !editorRef.current.parentElement) return;

        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = position.x;
        let newY = position.y;

        const parentRect = editorRef.current.parentElement.getBoundingClientRect();

        // 根据拖拽方向计算新的尺寸和位置
        if (direction.includes('right')) {
          newWidth = Math.max(300, Math.min(parentRect.width - position.x, startWidth + deltaX));
        }

        if (direction.includes('left')) {
          newWidth = Math.max(300, startWidth - deltaX);
          newX = Math.min(parentRect.width - newWidth, startLeft + deltaX);
        }

        if (direction.includes('bottom')) {
          newHeight = Math.max(200, Math.min(parentRect.height - position.y, startHeight + deltaY));
        }

        if (direction.includes('top')) {
          newHeight = Math.max(200, startHeight - deltaY);
          newY = Math.min(parentRect.height - newHeight, startTop + deltaY);
        }

        setDimensions({ width: `${newWidth}px`, height: `${newHeight}px` });
        setPosition({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        if (!isResizing.current) return;

        isResizing.current = false;
        document.body.style.userSelect = '';

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);

        document.body.style.cursor = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);

      // 设置鼠标样式
      document.body.style.cursor = 'default';
      if (direction === 'bottom-right' || direction === 'top-left') {
        document.body.style.cursor = 'se-resize';
      } else if (direction === 'bottom-left' || direction === 'top-right') {
        document.body.style.cursor = 'sw-resize';
      } else if (direction === 'right' || direction === 'left') {
        document.body.style.cursor = 'ew-resize';
      } else if (direction === 'bottom' || direction === 'top') {
        document.body.style.cursor = 'ns-resize';
      }
    }
  };

  // 伪实现目录内容显示
  const renderDirectoryContent = () => {
    const children = node.children || [];

    return (
      <div className="directory-content">
        <div className="directory-header">
          <h2>{node.name}</h2>
          <p>包含 {children.length} 个项目</p>
        </div>

        <div className="directory-actions">
          <button className="action-btn">新建文件</button>
          <button className="action-btn">新建文件夹</button>
          <button className="action-btn">上传文件</button>
        </div>

        <div className="directory-files">
          <div className="files-header">
            <div className="header-column">名称</div>
            <div className="header-column">类型</div>
            <div className="header-column">修改日期</div>
            <div className="header-column">大小</div>
          </div>

          {children.map((child) => (
            <div key={child.id} className="file-item">
              <div className="file-column">
                <span className="file-icon">{React.createElement(child.icon)}</span>
                <span className="file-name">{child.name}</span>
              </div>
              <div className="file-column">
                {child.nodeType === 'Directory' ? '文件夹' : '文件'}
              </div>
              <div className="file-column">今天</div>
              <div className="file-column">
                {child.nodeType === 'Directory' ? '--' : '1KB'}
              </div>
            </div>
          ))}

          {children.length === 0 && (
            <div className="empty-directory">
              <p>此文件夹为空</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={editorRef}
      className={`editor ${isWindowed ? 'windowed' : ''} ${isMaximized ? 'maximized' : ''}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        position: isWindowed ? 'absolute' : 'relative',
        left: isWindowed ? `${position.x}px` : '0',
        top: isWindowed ? `${position.y}px` : '0',
        zIndex: isWindowed ? 10 : 1
      }}
    >
      {/* 编辑器标题栏 */}
      <div
        className="editor-header"
        onMouseDown={startDrag}
      >
        <div className="editor-title">
          {React.createElement(node.icon)} Directory: {node.name}
        </div>
        <div className="editor-controls">
          <button className="control-btn" onClick={handleWindow}>
            {isWindowed ? '📦' : '🗔'}
          </button>
          <button className="control-btn" onClick={handleMaximize}>
            {isMaximized ? '📱' : '📲'}
          </button>
          <button className="control-btn close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div className="editor-content">
        {renderDirectoryContent()}
      </div>

      {/* 八个方向的调整大小器 */}
      {isWindowed && (
        <>
          <div className="editor-resizer top-left" onMouseDown={(e) => startResize(e, 'top-left')}></div>
          <div className="editor-resizer top" onMouseDown={(e) => startResize(e, 'top')}></div>
          <div className="editor-resizer top-right" onMouseDown={(e) => startResize(e, 'top-right')}></div>
          <div className="editor-resizer right" onMouseDown={(e) => startResize(e, 'right')}></div>
          <div className="editor-resizer bottom-right" onMouseDown={(e) => startResize(e, 'bottom-right')}></div>
          <div className="editor-resizer bottom" onMouseDown={(e) => startResize(e, 'bottom')}></div>
          <div className="editor-resizer bottom-left" onMouseDown={(e) => startResize(e, 'bottom-left')}></div>
          <div className="editor-resizer left" onMouseDown={(e) => startResize(e, 'left')}></div>
        </>
      )}
    </div>
  );
};

export default DirectoryPanel;