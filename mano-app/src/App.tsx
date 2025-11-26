import './App.css';
import { useEffect, useState } from 'react';
import { path } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { exists } from '@tauri-apps/plugin-fs';
import GmailSidebar from './components/GmailSidebar';
import Welcome from './components/Welcome';
import {
  Directory,
  GmailItem,
  LexicalText,
  Markdown,
  PlainText,
  RichText,
} from "./components/model";
import RichTextEditor from './components/RichTextEditor';
import PlainTextEditor from './components/PlainTextEditor';
import MarkdownEditor from './components/MarkdownEditor';
import DirectoryPanel from './components/DirectoryPanel';
import { getDefaultItems, loadDataFromConfig } from './components/controller';
import { ContextMenuProvider } from './components/context-menu';
import LexicalEditor from "@components/LexicalEditor.tsx";

function App() {
  const [selectedNode, setSelectedNode] = useState<GmailItem | null>(null);
  const [gmailItems, setGmailItems] = useState<GmailItem[]>([]);
  const [workspace, setWorkspace] = useState<string>("");
  const [eventCount, setEventCount] = useState(0);
  const [filename, setFilename] = useState<string>("");

  useEffect(() => {
    // 仅在 Tauri 环境中监听事件
    let cleanup: (() => void) | undefined;

    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const setupListener = async () => {
        try {
          cleanup = await listen<{ workspace: string }>(
            'workspace_updated',
            (event) => {
              const workspace = event.payload.workspace;
              console.log('workspace updated, workspace:', workspace, new Date().toISOString());
              setEventCount((prevCount) => prevCount + 1);
              setWorkspace(workspace.trim());
            },
          );
        } catch (error) {
          console.error('Failed to setup workspace listener:', error);
        }
      };

      setupListener();
    } else {
      // 非 Tauri 环境，使用默认数据
      console.log('Running in non-Tauri environment, using default items');
      setGmailItems(getDefaultItems());
    }
    return () => {
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    console.log('workspace effected: ', workspace);

    // if workspace is empty, use default items
    if (!workspace || workspace === '') {
      console.log('empty workspace found');
      setGmailItems(getDefaultItems());
      return;
    }

    path.join(workspace, 'mano.conf.json').then((filename: string) => {
      setFilename(filename);

      exists(filename).then((exists) => {
        if (exists) {
          console.log(filename, "exists", "try to load");
          loadDataFromConfig(filename).then((data) => {
            console.log('to setGmailItems:', data);
            setGmailItems(data);
          });
        } else {
          console.log(filename, "not exists", "set default");
          setGmailItems(getDefaultItems());
        }
      });
    });
  }, [eventCount]);

  // 关闭编辑器，返回Welcome界面
  const handleCloseEditor = () => {
    setSelectedNode(null);
  };

  // 根据节点类型渲染对应的编辑器
  const renderEditor = () => {
    if (!selectedNode) {
      return <Welcome />;
    }

    // 根据节点类型选择编辑器
    const nodeType = selectedNode.nodeType || 'PlainText';
    
    // 使用稳定 key：仅在选择的节点或类型变化时重新创建
    const uniqueKey = `${selectedNode.id}-${nodeType}`;
    
    if (nodeType === Directory) {
      return <DirectoryPanel key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
    } else if (nodeType === RichText) {
      return <RichTextEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} workspace={workspace} />;
    } else if (nodeType === PlainText) {
      return <PlainTextEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
    } else if (nodeType === Markdown) {
      return <MarkdownEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
    } else if (nodeType === LexicalText) {
      return <LexicalEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} workspace={workspace} />
    }

    return (
      <div className="editor-content-placeholder">
        <div className="placeholder-text">未知的编辑器类型</div>
      </div>
    );
  };

  return (
    <ContextMenuProvider>
      <div className="ide-layout">
        {/* 主布局 */}
        <div className="main-layout">
          {/* 左侧资源管理器 */}
          <div className="sidebar">
            <GmailSidebar onSelectNode={setSelectedNode} filename={filename} initialData={gmailItems} />


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

          {/* 中间编辑器区域 */}
          <div className="editor-container">
            {renderEditor()}
          </div>
        </div>
      </div>
    </ContextMenuProvider>
  );
}

export default App;