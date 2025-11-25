/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalCollaboration} from '@lexical/react/LexicalCollaborationContext';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {defineExtension, EditorState} from 'lexical';
import {type JSX, useMemo, useEffect} from 'react';

import {isDevPlayground} from './appSettings';
import {buildHTMLConfig} from './buildHTMLConfig';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import DocsPlugin from './plugins/DocsPlugin';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import {TableContext} from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { GmailItem } from '../model';

// 获取 Lexical JSON 格式的文件名
function getLexicalFilename(node: GmailItem): string {
  const safeName = node.name.replace(/[^a-zA-Z0-9一-龥]/g, '_');
  return `${safeName}.lexical.json`;
}

// 文件加载和保存插件
function FilePlugin({ node, workspace }: { node?: GmailItem; workspace?: string }): null {
  const [editor] = useLexicalComposerContext();

  // 加载文件内容
  useEffect(() => {
    if (!node || !workspace) {
      return;
    }

    const loadFileContent = async () => {
      try {
        const fileName = getLexicalFilename(node);
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        
        const workspacePath = workspace || '.';
        const filePath = await join(workspacePath, fileName);
        const content = await readTextFile(filePath);
        
        if (content) {
          // 解析 JSON 并恢复编辑器状态
          const editorStateJSON = JSON.parse(content);
          const editorState = editor.parseEditorState(editorStateJSON);
          editor.setEditorState(editorState);
          console.log('文件已加载:', fileName);
        }
      } catch (error) {
        // 文件不存在或读取失败，使用空编辑器
        console.log('LexicalTextEditor', '文件不存在或读取失败，创建新文件:', error);
      }
    };

    loadFileContent();
  }, [node, workspace, editor]);

  // 监听内容变化，自动保存
  useEffect(() => {
    if (!node || !workspace) {
      return;
    }

    let saveTimeout: ReturnType<typeof setTimeout>;
    
    const unregister = editor.registerUpdateListener(
      ({editorState}: {editorState: EditorState}) => {
        // 防抖处理，避免频繁保存
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            const fileName = getLexicalFilename(node);
            
            // 将编辑器状态序列化为 JSON
            const json = editorState.toJSON();
            const content = JSON.stringify(json, null, 2);
            
            const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');
            const { join } = await import('@tauri-apps/api/path');
            
            const workspacePath = workspace || '.';
            const dirExists = await exists(workspacePath);
            if (!dirExists) {
              await mkdir(workspacePath);
            }
            
            const filePath = await join(workspacePath, fileName);
            await writeTextFile(filePath, content);
            
            console.log('文件已保存:', fileName);
          } catch (error) {
            console.error('保存文件失败:', error);
          }
        }, 1000); // 1 秒防抖
      },
    );

    return () => {
      clearTimeout(saveTimeout);
      unregister();
    };
  }, [node, workspace, editor]);

  return null;
}

// 工具栏关闭按钮插件
function CloseButtonPlugin({ onClose }: { onClose?: () => void }): null {
  useEffect(() => {
    if (!onClose) {
      return;
    }

    // 等待 DOM 加载完成
    const timer = setTimeout(() => {
      const toolbar = document.querySelector('.toolbar');
      if (toolbar) {
        const closeButton = document.createElement('button');
        closeButton.className = 'toolbar-item';
        closeButton.innerHTML = `
          <svg viewBox="0 0 18 18" width="18" height="18" style="fill: currentColor;">
            <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"/>
          </svg>
        `;
        closeButton.title = '关闭编辑器';
        closeButton.style.cssText = `
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        `;
        closeButton.addEventListener('click', onClose);
        
        toolbar.appendChild(closeButton);

        return () => {
          if (toolbar.contains(closeButton)) {
            toolbar.removeChild(closeButton);
          }
        };
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return null;
}

interface AppWithFileProps {
  node?: GmailItem;
  workspace?: string;
  onClose?: () => void;
}

function App({ node, workspace, onClose }: AppWithFileProps): JSX.Element {
  const {
    settings: {measureTypingPerf},
  } = useSettings();

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: undefined, // 将由 FilePlugin 加载
        html: buildHTMLConfig(),
        name: '@lexical/playground',
        namespace: 'Playground',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [],
  );

  return (
    <LexicalCollaboration>
      <LexicalExtensionComposer extension={app} contentEditable={null}>
        <SharedHistoryContext>
          <TableContext>
            <ToolbarContext>
              <div className="editor-shell">
                <Editor />
                <FilePlugin node={node} workspace={workspace} />
                <CloseButtonPlugin onClose={onClose} />
              </div>
              <Settings />
              {isDevPlayground ? <DocsPlugin /> : null}
              {isDevPlayground ? <PasteLogPlugin /> : null}
              {isDevPlayground ? <TestRecorderPlugin /> : null}

              {measureTypingPerf ? <TypingPerfPlugin /> : null}
            </ToolbarContext>
          </TableContext>
        </SharedHistoryContext>
      </LexicalExtensionComposer>
    </LexicalCollaboration>
  );
}

export default function LexicalEditorWithFile({ node, workspace, onClose }: AppWithFileProps): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App node={node} workspace={workspace} onClose={onClose} />
      </FlashMessageContext>
    </SettingsContext>
  );
}
