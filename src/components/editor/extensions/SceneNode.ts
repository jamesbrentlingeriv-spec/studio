import { Node, mergeAttributes } from '@tiptap/core'

// Scene break node — renders "* * *" separator
export const SceneNode = Node.create({
  name: 'sceneBreak',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="scene-break"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'scene-break', class: 'scene-break' }), '* * *']
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-S': () => this.editor.commands.insertContent({ type: 'sceneBreak' }),
    }
  },
})
