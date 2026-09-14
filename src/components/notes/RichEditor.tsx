"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Highlighter,
  Undo2,
  Redo2,
} from "lucide-react";
import { classNames } from "@/lib/utils";

const TEXT_COLORS = ["#21261f", "#2b6e63", "#b54a3f", "#2b4c7e"];

export default function RichEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (doc: unknown) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
    ],
    content: content as never,
    editorProps: {
      attributes: {
        class: "tiptap-note text-[13.5px] leading-snug text-ink focus:outline-none min-h-[3.5em]",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    classNames(
      "rounded-md p-1 transition",
      active ? "bg-ink/10 text-ink" : "text-ink-soft hover:bg-ink/5"
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink/10 px-1.5 py-1">
        <button className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <Bold size={12.5} />
        </button>
        <button className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <Italic size={12.5} />
        </button>
        <button className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <UnderlineIcon size={12.5} />
        </button>
        <button className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough size={12.5} />
        </button>
        <div className="mx-0.5 h-3.5 w-px bg-ink/10" />
        <button className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list">
          <List size={12.5} />
        </button>
        <button className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered size={12.5} />
        </button>
        <button className={btn(editor.isActive("taskList"))} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checkbox list">
          <CheckSquare size={12.5} />
        </button>
        <div className="mx-0.5 h-3.5 w-px bg-ink/10" />
        <button
          className={btn(editor.isActive("link"))}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          title="Link"
        >
          <LinkIcon size={12.5} />
        </button>
        <button className={btn(editor.isActive("highlight"))} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
          <Highlighter size={12.5} />
        </button>
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => editor.chain().focus().setColor(c).run()}
            className="h-2.5 w-2.5 rounded-full border border-ink/10"
            style={{ backgroundColor: c }}
            title="Text color"
          />
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          <button className={btn(false)} onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
            <Undo2 size={12.5} />
          </button>
          <button className={btn(false)} onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={12.5} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2" onPointerDown={(e) => e.stopPropagation()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
