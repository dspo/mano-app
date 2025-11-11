import { EditorProps } from './types';

const Editor: React.FC<EditorProps> = ({ activeFile, activeFileInfo, showSearchPanel }) => {
  return (
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
  );
};

export default Editor;