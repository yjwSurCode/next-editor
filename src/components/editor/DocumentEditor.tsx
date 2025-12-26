'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { User } from '@supabase/supabase-js'
import { Document, EditorMode } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Comment } from '@/lib/editor/comment-extension'
import { TrackChanges, TrackInsert, TrackDelete } from '@/lib/editor/track-changes-extension'
import { Toolbar } from './Toolbar'
import { EditorHeader } from './EditorHeader'
import { CommentSidebar, CommentData } from './CommentSidebar'
import { SuggestionsBubble } from './SuggestionsBubble'
import { toast } from 'sonner'
import debounce from '@/lib/debounce'
import { v4 as uuidv4 } from 'uuid'

interface DocumentEditorProps {
  document: Document
  user: User
  initialComments?: CommentData[]
}

export function DocumentEditor({ document, user, initialComments = [] }: DocumentEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState(document.title)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [editorMode, setEditorMode] = useState<EditorMode>('editing')
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [showComments, setShowComments] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start typing or paste markdown...',
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Comment,
      TrackInsert,
      TrackDelete,
      TrackChanges.configure({
        enabled: false,
        userId: user.id,
      }),
    ],
    content: document.content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-16 py-8',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved')
      debouncedSave(editor.getJSON())
    },
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (content: unknown) => {
      setSaveStatus('saving')
      try {
        const { error } = await supabase
          .from('documents')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', document.id)

        if (error) throw error
        setSaveStatus('saved')
      } catch (error) {
        console.error('Error saving:', error)
        toast.error('Failed to save document')
        setSaveStatus('unsaved')
      }
    }, 1000),
    [document.id]
  )

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', document.id)

      if (error) throw error
    } catch (error) {
      console.error('Error saving title:', error)
      toast.error('Failed to save title')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)

      if (error) throw error
      router.push('/')
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete document')
    }
  }

  // Comment handlers
  const handleAddComment = useCallback(
    async (content: string, positionFrom: number, positionTo: number) => {
      const commentId = uuidv4()

      const newComment: CommentData = {
        id: commentId,
        content,
        positionFrom,
        positionTo,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email || 'Unknown',
        userAvatar: user.user_metadata?.avatar_url,
        resolved: false,
        createdAt: new Date().toISOString(),
      }

      // Add highlight to editor
      if (editor) {
        editor.chain().focus().setComment(commentId).run()
      }

      // Add to local state
      setComments((prev) => [...prev, newComment])

      // Save to database
      try {
        const { error } = await supabase.from('comments').insert({
          id: commentId,
          document_id: document.id,
          user_id: user.id,
          content,
          position_from: positionFrom,
          position_to: positionTo,
          resolved: false,
        })

        if (error) throw error
        toast.success('Comment added')
      } catch (error) {
        console.error('Error saving comment:', error)
        toast.error('Failed to save comment')
      }
    },
    [editor, document.id, user, supabase]
  )

  const handleResolveComment = useCallback(
    async (commentId: string) => {
      // Update local state
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c))
      )

      // Update in database
      try {
        const comment = comments.find((c) => c.id === commentId)
        const { error } = await supabase
          .from('comments')
          .update({ resolved: !comment?.resolved })
          .eq('id', commentId)

        if (error) throw error
      } catch (error) {
        console.error('Error updating comment:', error)
        toast.error('Failed to update comment')
      }
    },
    [comments, supabase]
  )

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      // Remove highlight from editor
      // Note: This is simplified - a full implementation would need to find
      // and remove the specific mark

      // Remove from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId))

      // Delete from database
      try {
        const { error } = await supabase.from('comments').delete().eq('id', commentId)

        if (error) throw error
        toast.success('Comment deleted')
      } catch (error) {
        console.error('Error deleting comment:', error)
        toast.error('Failed to delete comment')
      }
    },
    [supabase]
  )

  // Load comments on mount
  useEffect(() => {
    async function loadComments() {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('document_id', document.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        if (data) {
          const formattedComments: CommentData[] = data.map((c) => ({
            id: c.id,
            content: c.content,
            positionFrom: c.position_from,
            positionTo: c.position_to,
            userId: c.user_id,
            userName: 'User', // Would need to join with users table
            resolved: c.resolved,
            createdAt: c.created_at,
          }))
          setComments(formattedComments)
        }
      } catch (error) {
        console.error('Error loading comments:', error)
      }
    }

    loadComments()
  }, [document.id, supabase])

  // Toggle track changes based on editor mode
  useEffect(() => {
    if (!editor) return

    if (editorMode === 'suggesting') {
      editor.commands.enableTrackChanges()
    } else {
      editor.commands.disableTrackChanges()
    }

    // Set editable based on mode
    editor.setEditable(editorMode !== 'viewing')
  }, [editor, editorMode])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel?.()
    }
  }, [debouncedSave])

  if (!editor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <EditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        user={user}
        saveStatus={saveStatus}
        editorMode={editorMode}
        onModeChange={setEditorMode}
        onDelete={handleDelete}
        editor={editor}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
      />

      <Toolbar editor={editor} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto py-8">
          <div className="max-w-[816px] mx-auto bg-white shadow-lg rounded-sm min-h-[1056px]">
            <EditorContent editor={editor} />
            <SuggestionsBubble editor={editor} />
          </div>
        </div>

        {showComments && (
          <CommentSidebar
            editor={editor}
            comments={comments}
            user={user}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            onDeleteComment={handleDeleteComment}
          />
        )}
      </div>
    </div>
  )
}
