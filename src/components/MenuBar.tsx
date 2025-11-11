import { MenuBarProps } from './types';

const MenuBar: React.FC<MenuBarProps> = ({ showSearchPanel, onToggleSearch }) => {
  return (
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
          onClick={onToggleSearch}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          {showSearchPanel ? '关闭搜索' : '搜索'}
        </button>
      </div>
    </div>
  );
};

export default MenuBar;