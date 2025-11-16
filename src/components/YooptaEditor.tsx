import React, { useMemo } from "react";
import YooptaEditor, { Yoopta, createYooptaEditor } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';

const plugins = [Paragraph];

export default function YEditor() {
    const editor = useMemo(() => createYooptaEditor(), []);

    return (
        <div>
            <YooptaEditor editor={editor} plugins={plugins} placeholder="开始你的灵感之旅吧..." />
        </div>
    )
}
