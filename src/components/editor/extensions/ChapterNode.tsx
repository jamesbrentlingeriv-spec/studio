import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

// ─── Chapter Node View (React component) ─────────────────────────────────────

// TipTap's ReactNodeViewRenderer has complex generic types; using `as any` is the
// idiomatic workaround for this extension pattern.
function ChapterNodeView(props: Record<string, unknown>) {
  const node = props.node as unknown as { attrs: { chapterNumber: number; title: string; sectionId: number | null } }
  return (
    <NodeViewWrapper className="chapter-node" contentEditable={false}>
      <div className="chapter-label">Chapter {node.attrs.chapterNumber}</div>
      <div className="chapter-title">{node.attrs.title || `Chapter ${node.attrs.chapterNumber}`}</div>
      <div className="mt-4 w-12 h-px bg-current opacity-30 mx-auto" />
    </NodeViewWrapper>
  )
}

// ─── ChapterNode Extension ────────────────────────────────────────────────────

export const ChapterNode = Node.create({
  name: 'chapterNode',
  group: 'block',
  atom: true,   // non-editable block

  addAttributes() {
    return {
      chapterNumber: { default: 1 },
      title: { default: '' },
      sectionId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="chapter-node"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chapter-node' }), 0]
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNodeView() {
    return ReactNodeViewRenderer(ChapterNodeView as any)
  },
})
