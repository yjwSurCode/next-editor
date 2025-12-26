import { Mark, mergeAttributes, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// Track Insert Mark
export const TrackInsert = Mark.create({
  name: 'trackInsert',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-suggestion-id'),
        renderHTML: (attributes) => {
          if (!attributes.suggestionId) return {}
          return { 'data-suggestion-id': attributes.suggestionId }
        },
      },
      userId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-user-id'),
        renderHTML: (attributes) => {
          if (!attributes.userId) return {}
          return { 'data-user-id': attributes.userId }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span.track-insert' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'track-insert',
      }),
      0,
    ]
  },
})

// Track Delete Mark
export const TrackDelete = Mark.create({
  name: 'trackDelete',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-suggestion-id'),
        renderHTML: (attributes) => {
          if (!attributes.suggestionId) return {}
          return { 'data-suggestion-id': attributes.suggestionId }
        },
      },
      userId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-user-id'),
        renderHTML: (attributes) => {
          if (!attributes.userId) return {}
          return { 'data-user-id': attributes.userId }
        },
      },
      originalText: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span.track-delete' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'track-delete',
      }),
      0,
    ]
  },
})

// Track Changes Extension
export interface TrackChangesOptions {
  enabled: boolean
  userId: string | null
  onSuggestionCreate?: (suggestion: SuggestionData) => void
}

export interface SuggestionData {
  id: string
  type: 'insert' | 'delete'
  content: string
  position: { from: number; to: number }
  userId: string
}

const trackChangesPluginKey = new PluginKey('trackChanges')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    trackChanges: {
      enableTrackChanges: () => ReturnType
      disableTrackChanges: () => ReturnType
      acceptSuggestion: (suggestionId: string) => ReturnType
      rejectSuggestion: (suggestionId: string) => ReturnType
      acceptAllSuggestions: () => ReturnType
      rejectAllSuggestions: () => ReturnType
    }
  }
}

interface TrackChangesStorage {
  enabled: boolean
}

export const TrackChanges = Extension.create<TrackChangesOptions, TrackChangesStorage>({
  name: 'trackChanges',

  addOptions() {
    return {
      enabled: false,
      userId: null,
      onSuggestionCreate: undefined,
    }
  },

  addStorage() {
    return {
      enabled: this.options.enabled,
    }
  },

  addCommands() {
    return {
      enableTrackChanges:
        () =>
        ({ editor }) => {
          const storage = editor.storage as unknown as Record<string, TrackChangesStorage>
          storage.trackChanges.enabled = true
          return true
        },
      disableTrackChanges:
        () =>
        ({ editor }) => {
          const storage = editor.storage as unknown as Record<string, TrackChangesStorage>
          storage.trackChanges.enabled = false
          return true
        },
      acceptSuggestion:
        (suggestionId: string) =>
        ({ tr, state }) => {
          // Find and accept the suggestion
          state.doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.attrs.suggestionId === suggestionId) {
                if (mark.type.name === 'trackInsert') {
                  // Remove the mark but keep the content
                  tr.removeMark(pos, pos + node.nodeSize, mark.type)
                } else if (mark.type.name === 'trackDelete') {
                  // Remove the content entirely
                  tr.delete(pos, pos + node.nodeSize)
                }
              }
            })
          })
          return true
        },
      rejectSuggestion:
        (suggestionId: string) =>
        ({ tr, state }) => {
          // Find and reject the suggestion
          state.doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.attrs.suggestionId === suggestionId) {
                if (mark.type.name === 'trackInsert') {
                  // Remove the inserted content
                  tr.delete(pos, pos + node.nodeSize)
                } else if (mark.type.name === 'trackDelete') {
                  // Remove the mark but keep the content
                  tr.removeMark(pos, pos + node.nodeSize, mark.type)
                }
              }
            })
          })
          return true
        },
      acceptAllSuggestions:
        () =>
        ({ tr, state }) => {
          const insertMark = state.schema.marks.trackInsert
          const deleteMark = state.schema.marks.trackDelete

          // Remove all delete marks (keeping content) and insert marks (keeping content)
          if (insertMark) {
            tr.removeMark(0, state.doc.content.size, insertMark)
          }

          // For deletes, we need to actually delete the content
          if (deleteMark) {
            const nodesToDelete: { from: number; to: number }[] = []
            state.doc.descendants((node, pos) => {
              if (node.marks.some((m) => m.type.name === 'trackDelete')) {
                nodesToDelete.push({ from: pos, to: pos + node.nodeSize })
              }
            })
            // Delete in reverse order to maintain positions
            nodesToDelete.reverse().forEach(({ from, to }) => {
              tr.delete(from, to)
            })
          }

          return true
        },
      rejectAllSuggestions:
        () =>
        ({ tr, state }) => {
          const insertMark = state.schema.marks.trackInsert
          const deleteMark = state.schema.marks.trackDelete

          // For inserts, delete the content
          if (insertMark) {
            const nodesToDelete: { from: number; to: number }[] = []
            state.doc.descendants((node, pos) => {
              if (node.marks.some((m) => m.type.name === 'trackInsert')) {
                nodesToDelete.push({ from: pos, to: pos + node.nodeSize })
              }
            })
            nodesToDelete.reverse().forEach(({ from, to }) => {
              tr.delete(from, to)
            })
          }

          // Remove delete marks (keeping content)
          if (deleteMark) {
            tr.removeMark(0, state.doc.content.size, deleteMark)
          }

          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: trackChangesPluginKey,
        // Note: A full implementation would intercept transactions and
        // wrap insertions/deletions with marks when track changes is enabled.
        // This is a simplified version that provides the marks and commands.
      }),
    ]
  },
})
