import { useState, useRef, useEffect } from 'react';
import type { GmailItem } from '@components/model';

interface RichTextEditorProps {
    node: GmailItem;
    onClose: () => void;
}

/**
 * RichTextEditor component for editing rich text content with drag, resize, maximize and window functionality
 */
const RichTextEditor = ({ node: _node, onClose }: RichTextEditorProps) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isWindowed, setIsWindowed] = useState(false);
    const [dimensions, setDimensions] = useState({ width: '100%', height: '100%' });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const editorRef = useRef<HTMLDivElement>(null);
    // 暂时移除未使用的resizeRef
    const isResizing = useRef(false);
    const isDragging = useRef(false);
    const initialDimensions = useRef({ width: '100%', height: '100%' });
    const initialPosition = useRef({ x: 0, y: 0 });

    // 处理最大化/还原
    const handleMaximize = () => {
        if (!isMaximized) {
            // 保存当前尺寸
            if (editorRef.current) {
                initialDimensions.current = {
                    width: editorRef.current.style.width || '100%',
                    height: editorRef.current.style.height || '100%'
                };
            }
            setDimensions({ width: '100%', height: '100%' });
            setIsWindowed(false); // 最大化时取消窗口化状态
        } else {
            // 还原到之前的尺寸
            setDimensions(initialDimensions.current);
        }
        setIsMaximized(!isMaximized);
    };

    // 处理窗口化
    const handleWindow = () => {
        if (!isWindowed) {
            // 保存当前尺寸和位置
            if (editorRef.current) {
                initialDimensions.current = {
                    width: editorRef.current.style.width || '100%',
                    height: editorRef.current.style.height || '100%'
                };
                initialPosition.current = { ...position };
            }
            // 设置为窗口化尺寸（略微缩小）
            if (editorRef.current && editorRef.current.parentElement) {
                const parentWidth = editorRef.current.parentElement.offsetWidth;
                const parentHeight = editorRef.current.parentElement.offsetHeight;
                setDimensions({
                    width: `${parentWidth * 0.9}px`,
                    height: `${parentHeight * 0.9}px`
                });
                // 居中显示
                setPosition({
                    x: parentWidth * 0.05,
                    y: parentHeight * 0.05
                });
            }
            setIsMaximized(false); // 窗口化时取消最大化状态
        } else {
            // 还原到之前的尺寸和位置
            setDimensions(initialDimensions.current);
            setPosition(initialPosition.current);
        }
        setIsWindowed(!isWindowed);
    };

    // 开始拖拽
    const startDrag = (e: React.MouseEvent) => {
        // 只有在窗口化状态下可以拖拽
        if (!isWindowed || isMaximized) return;

        e.preventDefault();
        isDragging.current = true;
        document.body.style.userSelect = 'none';

        const startX = e.clientX;
        const startY = e.clientY;
        const currentX = position.x;
        const currentY = position.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging.current || !editorRef.current || !editorRef.current.parentElement) return;

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            // 计算新位置并限制在父容器内
            const parentRect = editorRef.current.parentElement.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();

            let newX = currentX + deltaX;
            let newY = currentY + deltaY;

            // 限制在父容器边界内
            newX = Math.max(0, Math.min(newX, parentRect.width - editorRect.width));
            newY = Math.max(0, Math.min(newY, parentRect.height - editorRect.height));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 开始调整大小
    const startResize = (e: React.MouseEvent, direction: string = 'bottom-right') => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.userSelect = 'none';

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = editorRef.current?.offsetWidth || 0;
        const startHeight = editorRef.current?.offsetHeight || 0;
        const startPosition = { ...position };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current || !editorRef.current) return;

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newX = startPosition.x;
            let newY = startPosition.y;

            // 根据方向调整尺寸和位置
            switch (direction) {
                case 'top-left':
                    newWidth = Math.max(200, startWidth - deltaX);
                    newHeight = Math.max(150, startHeight - deltaY);
                    newX = startPosition.x + deltaX;
                    newY = startPosition.y + deltaY;
                    break;
                case 'top':
                    newHeight = Math.max(150, startHeight - deltaY);
                    newY = startPosition.y + deltaY;
                    break;
                case 'top-right':
                    newWidth = Math.max(200, startWidth + deltaX);
                    newHeight = Math.max(150, startHeight - deltaY);
                    newY = startPosition.y + deltaY;
                    break;
                case 'right':
                    newWidth = Math.max(200, startWidth + deltaX);
                    break;
                case 'bottom-right':
                    newWidth = Math.max(200, startWidth + deltaX);
                    newHeight = Math.max(150, startHeight + deltaY);
                    break;
                case 'bottom':
                    newHeight = Math.max(150, startHeight + deltaY);
                    break;
                case 'bottom-left':
                    newWidth = Math.max(200, startWidth - deltaX);
                    newHeight = Math.max(150, startHeight + deltaY);
                    newX = startPosition.x + deltaX;
                    break;
                case 'left':
                    newWidth = Math.max(200, startWidth - deltaX);
                    newX = startPosition.x + deltaX;
                    break;
            }

            setDimensions({
                width: `${newWidth}px`,
                height: `${newHeight}px`
            });

            // 如果在窗口化状态下，同时更新位置
            if (isWindowed) {
                setPosition({ x: newX, y: newY });
            }

            // 调整大小时自动进入窗口化状态
            if (!isWindowed && !isMaximized) {
                setIsWindowed(true);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 组件卸载时清理事件监听器
    useEffect(() => {
        return () => {
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', () => { });
            document.removeEventListener('mouseup', () => { });
        };
    }, []);

    return (
        <div
            ref={editorRef}
            className={`editor rich-text-editor ${isMaximized ? 'maximized' : ''} ${isWindowed ? 'windowed' : ''} ${isDragging.current ? 'dragging' : ''}`}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                position: isWindowed ? 'absolute' : 'relative',
                left: isWindowed ? `${position.x}px` : 0,
                top: isWindowed ? `${position.y}px` : 0,
                resize: 'both',
                overflow: 'hidden'
            }}
        >
            <div className="editor-header" onMouseDown={startDrag}>
                <div className="editor-title">Rich Text Editor</div>
                <div className="editor-controls">
                    <button className="editor-close-btn" onClick={onClose}>
                        ×
                    </button>
                    <button className="editor-window-btn" onClick={handleWindow}>
                        ⥢
                    </button>
                    <button className="editor-maximize-btn" onClick={handleMaximize}>
                        {isMaximized ? '⤦' : '⤢'}
                    </button>
                </div>
            </div>
            <div className="editor-content">
                <div className="editor-placeholder">RichTextEditor 组件</div>
            </div>
      // 八个方向的调整大小器
            <div className="editor-resizer top-left" onMouseDown={(e) => startResize(e, 'top-left')}></div>
            <div className="editor-resizer top" onMouseDown={(e) => startResize(e, 'top')}></div>
            <div className="editor-resizer top-right" onMouseDown={(e) => startResize(e, 'top-right')}></div>
            <div className="editor-resizer right" onMouseDown={(e) => startResize(e, 'right')}></div>
            <div className="editor-resizer bottom-right" onMouseDown={(e) => startResize(e, 'bottom-right')}></div>
            <div className="editor-resizer bottom" onMouseDown={(e) => startResize(e, 'bottom')}></div>
            <div className="editor-resizer bottom-left" onMouseDown={(e) => startResize(e, 'bottom-left')}></div>
            <div className="editor-resizer left" onMouseDown={(e) => startResize(e, 'left')}></div>
        </div>
    );
};

export default RichTextEditor;