import {useMemo, useRef, useEffect} from "react";
import YooptaEditor, {createYooptaEditor} from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import {HeadingOne, HeadingTwo, HeadingThree} from '@yoopta/headings';
import ActionMenuList, {DefaultActionMenuRender} from '@yoopta/action-menu-list';
import {BulletedList, NumberedList, TodoList} from '@yoopta/lists';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';
import Divider from '@yoopta/divider';
import Image from '@yoopta/image';
import Link from '@yoopta/link';
import Table from '@yoopta/table';
import Accordion from '@yoopta/accordion';
import Callout from '@yoopta/callout';
import Embed from '@yoopta/embed';
import File from '@yoopta/file';
import Video from '@yoopta/video';
import FixedToolbar from './FixedToolbar';
import { GmailItem } from '@components/model';
import { getGmailItemFilename } from '@components/model';

const plugins = [
    Paragraph,
    HeadingOne,
    HeadingTwo,
    HeadingThree,
    BulletedList,
    NumberedList,
    TodoList,
    Blockquote,
    Code,
    Divider,
    Image,
    Link,
    Table,
    Accordion,
    Callout,
    Embed,
    File,
    Video,
];

const TOOLS = {
    ActionMenu: {
        render: DefaultActionMenuRender,
        tool: ActionMenuList,
    },
};

const DEFAULT_DATA = [
    {
        id: '1',
        type: 'heading-one',
        children: [
            {
                text: 'Welcome to Yoopta Editor!',
            },
        ],
    },
    {
        id: '2',
        type: 'paragraph',
        children: [
            {
                text: 'This is a powerful rich text editor with many features.',
            },
        ],
    },
    {
        id: '3',
        type: 'accordion',
        props: {
            items: [
                {
                    id: 'accordion-item-1',
                    title: 'First Accordion Item',
                    content: [
                        {
                            id: 'accordion-content-1',
                            type: 'paragraph',
                            children: [
                                {
                                    text: 'This is the content of the first accordion item.',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'accordion-item-2',
                    title: 'Second Accordion Item',
                    content: [
                        {
                            id: 'accordion-content-2',
                            type: 'paragraph',
                            children: [
                                {
                                    text: 'This is the content of the second accordion item.',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        children: [
            {
                text: '',
            },
        ],
    },
    {
        id: '4',
        type: 'paragraph',
        children: [
            {
                text: 'You can add various types of content including images, tables, code blocks, and more.',
            },
        ],
    },
];

interface YEditorProps {
    node: GmailItem;
    workspace?: string;
    onClose: () => void;
}

export default function YEditor({ node, workspace, onClose }: YEditorProps) {
    const editor = useMemo(() => createYooptaEditor(), []);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const filename = getGmailItemFilename(node);

    // 加载文件内容
    useEffect(() => {
        let mounted = true;
        
        const loadFileContent = async () => {
            try {
                const { readTextFile } = await import('@tauri-apps/plugin-fs');
                const { join } = await import('@tauri-apps/api/path');
                
                const workspacePath = workspace || '.';
                const filePath = await join(workspacePath, filename);
                const content = await readTextFile(filePath);
                
                if (content && mounted) {
                    try {
                        const parsedContent = JSON.parse(content);
                        editor.setEditorValue(parsedContent);
                    } catch {
                        // 忽略解析错误，使用空编辑器
                        console.log('使用空编辑器');
                    }
                }
            } catch (error) {
                console.log('文件不存在，创建新文件');
            }
        };

        loadFileContent();
        
        return () => {
            mounted = false;
        };
    }, [node, workspace, editor, filename]);

    // 自动保存
    useEffect(() => {
        const saveContent = async () => {
            try {
                const currentContent = editor.getEditorValue();
                const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');
                const { join } = await import('@tauri-apps/api/path');
                
                const workspacePath = workspace || '.';
                const dirExists = await exists(workspacePath);
                if (!dirExists) {
                    await mkdir(workspacePath);
                }
                
                const filePath = await join(workspacePath, filename);
                await writeTextFile(filePath, JSON.stringify(currentContent, null, 2));
                console.log('文件已保存:', filename);
            } catch (error) {
                console.error('保存文件失败:', error);
            }
        };

        const handleChange = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(saveContent, 1000);
        };

        editor.on('change', handleChange);

        return () => {
            editor.off('change', handleChange);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [editor, workspace, filename]);

    // 注入样式修复菜单显示
    useEffect(() => {
        const styleId = 'yoopta-menu-style-fix';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                [data-yoopta-action-menu-list] {
                    background: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                    padding: 4px !important;
                    z-index: 9999 !important;
                }
                [data-yoopta-action-menu-list] button,
                [data-yoopta-action-menu-list] [role="button"] {
                    background: transparent !important;
                    color: #111827 !important;
                    padding: 8px 12px !important;
                    border-radius: 6px !important;
                    margin: 2px 0 !important;
                    cursor: pointer !important;
                    transition: all 0.15s ease !important;
                }
                [data-yoopta-action-menu-list] button:hover,
                [data-yoopta-action-menu-list] [role="button"]:hover,
                [data-yoopta-action-menu-list] button[data-state="active"],
                [data-yoopta-action-menu-list] [data-state="active"] {
                    background: #f3f4f6 !important;
                    color: #000000 !important;
                }
                [data-yoopta-action-menu-list] svg {
                    color: #6b7280 !important;
                }
                [data-yoopta-action-menu-list] button:hover svg,
                [data-yoopta-action-menu-list] [data-state="active"] svg {
                    color: #111827 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        return () => {
            const style = document.getElementById(styleId);
            if (style) {
                document.head.removeChild(style);
            }
        };
    }, []);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: '#ffffff',
                overflow: 'auto',
                padding: '40px',
            }}
        >
            <style>
                {`
                    .fixed-toolbar {
                        position: sticky;
                        top: 0;
                        background: #ffffff;
                        border-bottom: 1px solid #e5e7eb;
                        padding: 12px 0;
                        margin-bottom: 24px;
                        z-index: 100;
                    }
                    .toolbar-row {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 8px;
                        flex-wrap: wrap;
                    }
                    .toolbar-row:last-child {
                        margin-bottom: 0;
                    }
                    .fixed-toolbar button {
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        background: #ffffff;
                        color: #374151;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        white-space: nowrap;
                    }
                    .fixed-toolbar button:hover {
                        background: #f9fafb;
                        border-color: #9ca3af;
                    }
                    .fixed-toolbar button:active {
                        background: #f3f4f6;
                        transform: translateY(0.5px);
                    }
                    .yoopta-editor-container {
                        max-width: 750px;
                        margin: 0 auto;
                        padding: 24px;
                        background: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                `}
            </style>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.95)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    zIndex: 1000,
                    color: '#64748b',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
            >
                <svg viewBox="0 0 18 18" width="16" height="16" fill="currentColor">
                    <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"/>
                </svg>
            </button>

            <FixedToolbar editor={editor} DEFAULT_DATA={DEFAULT_DATA} />
            <div className="yoopta-editor-container">
                <YooptaEditor
                    editor={editor}
                    plugins={plugins as any}
                    tools={TOOLS}
                    placeholder="开始你的灵感之旅吧..."
                />
            </div>
        </div>
    )
}
