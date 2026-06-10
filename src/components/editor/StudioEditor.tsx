import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Link from '@tiptap/extension-link'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useStudioStore } from '@/store/useStudioStore'
import { ChapterNode } from './extensions/ChapterNode.tsx'
import { SceneNode } from './extensions/SceneNode'
import Toolbar from './Toolbar'
import FocusMode from './FocusMode'
import ManuscriptNavigator from '../sidebar/ManuscriptNavigator'
import TypesetterPanel from '../typesetter/TypesetterPanel'
import { Eye } from 'lucide-react'
import '@/styles/editor.css'

// Count words from plain text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function StudioEditor() {
  const {
    activeManuscript,
    activeSectionId,
    sections,
    saveContent,
    settings,
  } = useStudioStore()

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosaveMs = Number(settings.autosave_interval_ms ?? 30000)
  const [focusMode, setFocusMode] = useState(false)

  const activeSection = sections.find(s => s.id === activeSectionId)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: { depth: 200 },
      }),
      Underline,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Typography,
      Superscript,
      Subscript,
      Link.configure({ openOnClick: false }),
      CharacterCount,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Chapter title…'
          return 'Begin writing your story…'
        },
        emptyEditorClass: 'is-editor-empty',
      }),
      ChapterNode,
      SceneNode,
    ],
    content: activeSection?.content ? JSON.parse(activeSection.content) : '',
    editorProps: {
      attributes: {
        class: 'ProseMirror allow-select',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeSectionId) return

      // Debounce autosave
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(async () => {
        const json = JSON.stringify(editor.getJSON())
        const words = countWords(editor.getText())
        await saveContent(activeSectionId, json, words)
      }, autosaveMs)
    },
  })

  // Load section content when active section changes
  useEffect(() => {
    if (!editor || !activeSection) return
    const currentJson = JSON.stringify(editor.getJSON())
    const sectionJson = activeSection.content ?? '{}'
    if (currentJson !== sectionJson) {
      try {
        editor.commands.setContent(JSON.parse(sectionJson), false)
      } catch {
        editor.commands.clearContent()
      }
    }
  }, [activeSectionId])

  // Cleanup autosave on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  const wordCount = editor?.storage.characterCount.words() ?? 0
  const charCount = editor?.storage.characterCount.characters() ?? 0

  return (
    <div className="flex h-full">
      {/* Manuscript Navigator — left mini sidebar inside editor */}
      <ManuscriptNavigator />

      {/* Editor Column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <Toolbar editor={editor} />

        {/* Document Meta Bar */}
        {activeManuscript && (
          <div className="flex items-center gap-3 px-6 py-2 bg-white border-b border-gray-100 text-sm text-gray-500 flex-shrink-0">
            <span className="font-semibold text-[#1a1f2e]">{activeManuscript.title}</span>
            {activeSection && (
              <>
                <span>·</span>
                <span>{activeSection.title}</span>
              </>
            )}
            <span className="ml-auto text-xs">
              {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
            </span>
            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-md transition-all ml-2 ${
                focusMode
                  ? 'bg-brand/15 text-brand font-semibold'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Focus Mode"
            >
              <Eye size={12} />
              {focusMode ? 'Focusing' : 'Focus'}
            </button>
          </div>
        )}

        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden tiptap-editor-wrapper">
          {activeSectionId ? (
            <div className="tiptap-page">
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-3">✍️</div>
                <p className="text-base font-medium">Select a chapter to start writing</p>
                <p className="text-sm opacity-60 mt-1">Or create a new chapter in the navigator</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Focus Mode Overlay */}
      <FocusMode enabled={focusMode} onToggle={() => setFocusMode(false)} />

      {/* Typesetter Panel — right side */}
      <TypesetterPanel editor={editor} />
    </div>
  )
}
