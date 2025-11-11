import React from 'react';
import { PropertyPanelProps } from './types';

const PropertyPanel: React.FC<PropertyPanelProps> = ({ activeFileInfo }) => {
  return (
    <div className="right-panel">
      <h3>文档信息</h3>
      <div className="panel-content">
        {activeFileInfo && (
          <React.Fragment>
            <p>文件名: {activeFileInfo.name}</p>
            <p>类型: {activeFileInfo.type === 'file' ? '文本文件' : '文件夹'}</p>
            <p>修改日期: 今天</p>
            <p>字数: 0</p>
          </React.Fragment>
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
  );
};

export default PropertyPanel;