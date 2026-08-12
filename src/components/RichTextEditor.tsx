import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write a description…',
  minHeightClass = 'min-h-[110px]'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Only push the external value into the DOM when it actually differs from
  // what's rendered — otherwise every keystroke would reset the cursor.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  const isEmpty = !value || value === '<br>' || value.trim() === '';

  const toolbarButtons: { command: string; icon: React.ReactNode; title: string }[] = [
    { command: 'bold', icon: <Bold className="h-3.5 w-3.5" />, title: 'Bold' },
    { command: 'italic', icon: <Italic className="h-3.5 w-3.5" />, title: 'Italic' },
    { command: 'underline', icon: <Underline className="h-3.5 w-3.5" />, title: 'Underline' },
    { command: 'insertUnorderedList', icon: <List className="h-3.5 w-3.5" />, title: 'Bullet list' },
    { command: 'insertOrderedList', icon: <ListOrdered className="h-3.5 w-3.5" />, title: 'Numbered list' }
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-white">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            title={btn.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(btn.command)}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          >
            {btn.icon}
          </button>
        ))}
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          type="button"
          title="Clear formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('removeFormat')}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute top-2.5 left-3 text-xs text-slate-400">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className={`w-full p-2.5 text-xs leading-relaxed text-slate-800 focus:outline-none ${minHeightClass}`}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};