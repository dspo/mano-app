import React from 'react';

interface Props {
  editor: any;
  DEFAULT_DATA: any;
}

const FixedToolbar: React.FC<Props> = ({ editor, DEFAULT_DATA }) => {
  const handleSetData = () => {
    editor.setValue(DEFAULT_DATA);
  };

  const handleImage = () => {
    if (editor.commands?.insertImage) {
      editor.commands.insertImage({
        src: 'https://res.cloudinary.com/ench-app/image/upload/v1728722617/photo-1718808968741-8d1b96cd166a_y5kqe5.jpg',
        alt: 'Editor Image',
        sizes: { width: 400, height: 300 },
      });
    }
  };

  const handleToggleBlockquote = () => {
    if (editor.commands?.toggleBlockquote) {
      editor.commands.toggleBlockquote();
    }
  };

  const handleInsertCallout = () => {
    if (editor.commands?.insertCallout) {
      editor.commands.insertCallout({ text: 'This is a callout block' });
    }
  };

  const handleDuplicateBlock = () => {
    if (editor.commands?.duplicateBlocks) {
      editor.commands.duplicateBlocks();
    }
  };

  const handleInsertEmbed = () => {
    if (editor.commands?.insertEmbed) {
      editor.commands.insertEmbed({
        provider: 'youtube',
        source: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        styles: { width: 640, height: 360 },
      });
    }
  };

  const handleInsertTable3x3 = () => {
    if (editor.commands?.insertTable) {
      editor.commands.insertTable({ rows: 3, columns: 3 });
    }
  };

  const handleInsertTable6x4 = () => {
    if (editor.commands?.insertTable) {
      editor.commands.insertTable({ rows: 6, columns: 4 });
    }
  };

  const handleSelectAll = () => {
    if (editor.commands?.selectAll) {
      editor.commands.selectAll();
    }
  };

  const handleInsertLink = () => {
    if (editor.commands?.insertLink) {
      editor.commands.insertLink({
        text: 'Yoopta Editor',
        href: 'https://github.com/Darginec05/Yoopta-Editor',
      });
    }
  };

  const handleInsertAccordion = () => {
    if (editor.commands?.insertAccordion) {
      editor.commands.insertAccordion({
        items: [
          { title: 'First Item', content: 'First item content' },
          { title: 'Second Item', content: 'Second item content' },
          { title: 'Third Item', content: 'Third item content' },
          { title: 'Fourth Item', content: 'Fourth item content' },
        ],
      });
    }
  };

  const handleInsertHeadingOne = () => {
    if (editor.commands?.toggleHeadingOne) {
      editor.commands.toggleHeadingOne({ text: 'Heading One Text' });
    }
  };

  const handleRedo = () => {
    if (editor.commands?.redo) {
      editor.commands.redo();
    }
  };

  const handleUndo = () => {
    if (editor.commands?.undo) {
      editor.commands.undo();
    }
  };

  const handleGetEmail = () => {
    if (editor.getPlainText) {
      const email = editor.getPlainText();
      console.log('Email content:', email);
    }
  };

  return (
    <div className="fixed-toolbar">
      <div className="toolbar-row">
        <button onClick={handleSetData}>Set Data</button>
        <button onClick={handleImage}>Image</button>
        <button onClick={handleToggleBlockquote}>Quote</button>
        <button onClick={handleInsertCallout}>Callout</button>
        <button onClick={handleDuplicateBlock}>Copy Block</button>
        <button onClick={handleInsertEmbed}>Embed</button>
        <button onClick={handleInsertTable3x3}>Table 3x3</button>
        <button onClick={handleInsertTable6x4}>Table 6x4</button>
        <button onClick={handleSelectAll}>Select All</button>
      </div>
      <div className="toolbar-row">
        <button onClick={handleInsertLink}>Link</button>
        <button onClick={handleInsertAccordion}>Accordion</button>
        <button onClick={handleInsertHeadingOne}>H1</button>
        <button onClick={handleRedo}>Redo</button>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleGetEmail}>Get Email</button>
      </div>
    </div>
  );
};

export default FixedToolbar;