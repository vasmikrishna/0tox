"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
} from "lucide-react"

interface BlogEditorProps {
  value: string
  json?: unknown
  onChange: (html: string, json: unknown) => void
}

export function BlogEditor({ value, json, onChange }: BlogEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // StarterKit v3 bundles Link + Underline; disable so our configured
        // versions below register without a duplicate-extension error.
        link: false,
        underline: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: { class: "text-sky-400 underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[420px] rounded-md border border-border bg-background px-4 py-3 text-sm leading-7"
        ),
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML(), activeEditor.getJSON())
    },
  })

  function addLink() {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", previousUrl ?? "https://")
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/20 p-2">
        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("bold") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("italic") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("underline") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-underline"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          className="h-8 px-2 text-xs font-bold"
          data-testid="editor-h2"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("heading", { level: 3 }) ? "default" : "ghost"}
          className="h-8 px-2 text-xs font-bold"
          data-testid="editor-h3"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("bulletList") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-bullet-list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("orderedList") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-ordered-list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("blockquote") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-blockquote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          size="sm"
          variant={editor?.isActive("link") ? "default" : "ghost"}
          className="h-8 px-2"
          data-testid="editor-link"
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          data-testid="editor-unlink"
          onClick={() => editor?.chain().focus().unsetLink().run()}
        >
          <Unlink className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          data-testid="editor-undo"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          data-testid="editor-redo"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="bg-muted/30 p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
