import React from 'react';
import type { GmailItem } from '@components/model';

interface DirectoryPanelProps {
  node: GmailItem;
  onClose: () => void;
}

/**
 * 简化的目录面板组件 - 仅显示基本信息
 */
const DirectoryPanel = ({ node, onClose }: DirectoryPanelProps) => {
  const children = node.children || [];

  return (
    <div className="editor">
      {/* 简单的标题栏 */}
      <div className="editor-header">
        <div className="editor-title">
          {node.icon ? React.createElement(node.icon) : '📁'} {node.name}
        </div>
        <div className="editor-controls">
          <button className="control-btn close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* 简化的内容区域 */}
      <div className="editor-content">
        <div style={{ padding: '20px' }}>
          <h3>📁 {node.name}</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            包含 {children.length} 个项目
          </p>
          
          {children.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto auto',
              gap: '10px',
              fontSize: '14px'
            }}>
              {children.map((child) => (
                <React.Fragment key={child.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{child.icon ? React.createElement(child.icon) : '📄'}</span>
                    <span>{child.name}</span>
                  </div>
                  <div style={{ color: '#999' }}>
                    {child.nodeType === 'Directory' ? '文件夹' : '文件'}
                  </div>
                  <div style={{ color: '#999' }}>--</div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#999', 
              padding: '40px 20px',
              border: '2px dashed #eee',
              borderRadius: '8px'
            }}>
              <p>📂 此文件夹为空</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryPanel;