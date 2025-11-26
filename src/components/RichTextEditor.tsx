import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { GmailItem } from '@components/model';
import { getGmailItemFilename } from '@components/model';

interface RichTextEditorProps {
    node: GmailItem;
    workspace?: string;
    onClose: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ node, workspace, onClose }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorContentRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    // 获取文件名
    const filename = getGmailItemFilename(node);

    // 初始化 Quill 编辑器
    useEffect(() => {
        if (editorContentRef.current) {
            // 确保容器完全清空，避免重复创建
            editorContentRef.current.innerHTML = '';
            
            // 创建新的Quill实例
            const quill = new Quill(editorContentRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: {
                        container: [
                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                             ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'script': 'sub'}, { 'script': 'super' }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'indent': '-1'}, { 'indent': '+1' }],
                            [{ 'direction': 'rtl' }],
                            [{ 'align': [] }],
                            ['link', 'image', 'video'],
                            ['clean'],
                            ['blockquote', 'code-block'],
                            [{ 'font': [] }],
                            ['close-editor'] // 添加自定义关闭按钮
                        ],
                        handlers: {
                            'close-editor': function() {
                                // 这里将通过引用调用onClose
                                const win = window as any;
                                if (win.closeEditorHandler) {
                                    win.closeEditorHandler();
                                }
                            }
                        }
                    }
                },
                placeholder: '请开始你的灵感之旅吧...'
            });

            // 添加自定义关闭按钮的图标和样式
            const toolbar = quill.getModule('toolbar') as any;
            if (toolbar && toolbar.container) {
                const closeButton = toolbar.container.querySelector('.ql-close-editor');
                if (closeButton) {
                    closeButton.innerHTML = '<svg viewBox="0 0 18 18" width="16" height="16"><path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"/></svg>';
                    closeButton.style.cssText = `
                        margin-left: auto !important;
                        margin-right: 0px !important;
                        background: rgba(255, 255, 255, 0.95) !important;
                        border: none !important;
                        border-radius: 0 !important;
                        width: 24px !important;
                        height: 24px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        cursor: pointer !important;
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                        transition: all 0.2s ease !important;
                        color: #64748b !important;
                        padding: 0 !important;
                    `;
                    
                    // 添加悬停效果
                    closeButton.addEventListener('mouseenter', () => {
                        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                        closeButton.style.borderColor = 'transparent';
                        closeButton.style.color = '#ef4444';
                        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    });
                    
                    closeButton.addEventListener('mouseleave', () => {
                        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                        closeButton.style.borderColor = 'transparent';
                        closeButton.style.color = '#64748b';
                        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    });
                }
            }

            quillRef.current = quill;

            // 加载文件内容
            const loadFileContent = async () => {
                try {
                    // 使用 filename() 方法获取文件名
                    const fileName = filename;

                    // 尝试读取文件内容
                    const { readTextFile } = await import('@tauri-apps/plugin-fs');
                    const { join } = await import('@tauri-apps/api/path');
                    
                    // 使用 workspace 路径，如果没有则使用当前目录
                    const workspacePath = workspace || '.';
                    const filePath = await join(workspacePath, fileName);
                    const content = await readTextFile(filePath);
                    
                    if (content) {
                        quill.setText(content);
                    }
                } catch (error) {
                    // 文件不存在或读取失败，使用空编辑器
                    console.log('RichTextEditor', '文件不存在或读取失败，创建新文件:', error);
                    quill.setText('');
                }
            };

            loadFileContent();

            // 监听内容变化，自动保存到文件
            let saveTimeout: ReturnType<typeof setTimeout>;
            quill.on('text-change', () => {
                // 防抖处理，避免频繁保存
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(async () => {
                    try {
                        const currentContent = quill.getText();
                        const fileName = filename; // 使用 filename() 方法获取文件名
                        
                        const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');
                        const { join } = await import('@tauri-apps/api/path');
                        
                        // 使用 workspace 路径，如果没有则使用当前目录
                        const workspacePath = workspace || '.';
                        const dirExists = await exists(workspacePath);
                        if (!dirExists) {
                            await mkdir(workspacePath);
                        }
                        
                        const filePath = await join(workspacePath, fileName);
                        await writeTextFile(filePath, currentContent);
                        
                        console.log('文件已保存:', fileName);
                    } catch (error) {
                        console.error('保存文件失败:', error);
                    }
                }, 1000); // 1 秒防抖
            });
        }

        return () => {
            if (quillRef.current) {
                const quill = quillRef.current;
                // 仅移除事件监听，避免与 React 卸载流程冲突
                try {
                    quill.off('text-change');
                } catch {}
                // 释放引用，让 GC 回收；不要手动移除子节点或工具栏
                quillRef.current = null;
            }
            // 交由 React 卸载 DOM；最多清空容器自身内容即可
            if (editorContentRef.current) {
                editorContentRef.current.innerHTML = '';
            }
        };
    }, [node, workspace]);

    // 设置全局关闭处理函数
    useEffect(() => {
        (window as any).closeEditorHandler = onClose;
        
        return () => {
            delete (window as any).closeEditorHandler;
        };
    }, [onClose]);



    return (
        <div
            ref={editorRef}
            className="editor rich-text-editor"
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div 
                className="editor-content"
                style={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative'
                }}
            >
                <div 
                    ref={editorContentRef} 
                    className="quill-editor"
                    style={{
                        height: '100%'
                    }}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;