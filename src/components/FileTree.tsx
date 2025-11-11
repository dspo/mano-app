import { TreeNode, FileTreeProps } from './types';

const FileTree: React.FC<FileTreeProps> = ({
  fileTree,
  expandedNodes,
  activeFile,
  onToggleNode,
  onSelectFile
}) => {
  // 递归渲染文件树节点
  const renderTreeNode = (node: TreeNode, level = 0) => {
    const paddingLeft = `${level * 24}px`;
    const isActiveFile = !node.isDirectory && activeFile === node.name;
    
    return (
      <div key={node.id || node.name} className="tree-node">
        <div 
          className={`node-content ${node.isDirectory ? 'directory' : 'file'} ${isActiveFile ? 'active' : ''}`}
          style={{ paddingLeft }}
          onClick={() => node.isDirectory ? onToggleNode(node.name) : onSelectFile(node.name)}
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

  return (
    <div className="file-tree">
      {fileTree.map(node => renderTreeNode(node))}
    </div>
  );
};

export default FileTree;