import {useMemo} from "react";
import YooptaEditor, {createYooptaEditor} from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import {HeadingOne, HeadingTwo} from '@yoopta/headings';

import ActionMenuList, {DefaultActionMenuRender} from '@yoopta/action-menu-list';
import {BulletedList, NumberedList, TodoList} from '@yoopta/lists';

export default function YEditor() {
    const editor = useMemo(() => createYooptaEditor(), []);
    const plugins = [
        Paragraph,
        HeadingOne,
        HeadingTwo,
        BulletedList,
        NumberedList,
        TodoList,
    ];

    const TOOLS = {
        ActionMenu: {
            render: DefaultActionMenuRender,
            tool: ActionMenuList,
        },
    };

    return (
        <YooptaEditor
            editor={editor}
            plugins={plugins}
            tools={TOOLS}
            placeholder="开始你的灵感之旅吧..."
            // Make the internal editor occupy the space and have a min height
            style={{minHeight: 260}}
        />
    )
}
