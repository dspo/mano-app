import { EditorProps } from './types';

const Editor: React.FC<EditorProps> = ({ activeFile, activeFileInfo }) => {
  return (
    <div className="editor">
      <div className="editor-header">
        <span className="file-name">
          {activeFileInfo?.icon} {activeFile}
        </span>
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