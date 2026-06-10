import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Link2, Undo, Redo, Heading1, Heading2,
  Minus, Quote, Type,
} from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'

interface Props {
  editor: Editor | null
}

function ToolbarBtn({
  onClick, active, disabled, title, children
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center w-7 h-7 rounded text-sm transition-all
        ${active
          ? 'bg-brand/20 text-brand'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />
}

export default function Toolbar({ editor }: Props) {
  const { customFonts, settings } = useStudioStore()

  if (!editor) return null

  const builtInFonts = [
    { label: 'Georgia (Serif)', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Palatino', value: 'Palatino, "Palatino Linotype", serif' },
    { label: 'Garamond', value: 'Garamond, serif' },
    { label: 'Inter (Sans)', value: 'Inter, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { label: 'Courier New (Mono)', value: '"Courier New", Courier, monospace' },
  ]

  const allFonts = [
    ...builtInFonts,
    ...customFonts.map(f => ({ label: `${f.family_name} (custom)`, value: `"${f.family_name}"` })),
  ]

  const fontSizes = ['10', '11', '12', '13', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48']

  return (
    <div className="toolbar flex items-center gap-0.5 px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0 flex-wrap">
      {/* Undo / Redo */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Font family */}
      <select
        onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand/30 w-36"
        title="Font family"
      >
        <option value="">Font…</option>
        {allFonts.map(f => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
        ))}
      </select>

      {/* Font size */}
      <select
        onChange={e => editor.chain().focus().run()}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand/30 w-14 ml-1"
        title="Font size"
      >
        {fontSizes.map(s => (
          <option key={s} value={s} selected={s === '14'}>{s}pt</option>
        ))}
      </select>

      <Divider />

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Text formatting */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Alignment */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      >
        <AlignLeft size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Align center"
      >
        <AlignCenter size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      >
        <AlignRight size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <ListOrdered size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Blockquote */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote size={14} />
      </ToolbarBtn>

      {/* Horizontal rule (scene break) */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Scene break (* * *)"
      >
        <Minus size={14} />
      </ToolbarBtn>

      {/* Link */}
      <ToolbarBtn
        onClick={() => {
          const url = window.prompt('Enter URL')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        active={editor.isActive('link')}
        title="Add link"
      >
        <Link2 size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Paragraph style selector */}
      <select
        onChange={e => {
          const val = e.target.value
          if (val === 'paragraph') editor.chain().focus().setParagraph().run()
          else if (val.startsWith('h')) {
            const level = parseInt(val.slice(1)) as 1 | 2 | 3
            editor.chain().focus().setHeading({ level }).run()
          }
        }}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand/30 w-28"
        title="Paragraph style"
      >
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
    </div>
  )
}
