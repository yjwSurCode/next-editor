'use client'

import { useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from '@/lib/date'
import { User } from '@supabase/supabase-js'

export interface CommentData {
  id: string
  content: string
  positionFrom: number
  positionTo: number
  userId: string
  userName: string
  userAvatar?: string
  resolved: boolean
  createdAt: string
}

interface CommentSidebarProps {
  editor: Editor
  comments: CommentData[]
  user: User
  onAddComment: (content: string, positionFrom: number, positionTo: number) => void
  onResolveComment: (commentId: string) => void
  onDeleteComment: (commentId: string) => void
}

export function CommentSidebar({
  editor,
  comments,
  user,
  onAddComment,
  onResolveComment,
  onDeleteComment,
}: CommentSidebarProps) {
  const [newComment, setNewComment] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const selection = editor.state.selection
  const hasSelection = !selection.empty
  const selectionFrom = selection.from
  const selectionTo = selection.to

  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !hasSelection) return

    onAddComment(newComment.trim(), selectionFrom, selectionTo)
    setNewComment('')
    setIsAdding(false)
  }, [newComment, hasSelection, selectionFrom, selectionTo, onAddComment])

  const activeComments = comments.filter((c) => !c.resolved)
  const resolvedComments = comments.filter((c) => c.resolved)

  return (
    <div className="w-80 bg-white border-l flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Comments</h2>
      </div>

      {/* Add comment section */}
      {hasSelection && (
        <div className="p-4 border-b bg-blue-50">
          {isAdding ? (
            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 border rounded-md text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  Comment
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false)
                    setNewComment('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add comment on selection
            </Button>
          )}
        </div>
      )}

      <ScrollArea className="flex-1">
        {activeComments.length === 0 && resolvedComments.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <p>No comments yet</p>
            <p className="mt-1">Select text to add a comment</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Active comments */}
            {activeComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isOwner={comment.userId === user.id}
                onResolve={() => onResolveComment(comment.id)}
                onDelete={() => onDeleteComment(comment.id)}
                onClick={() => {
                  // Scroll to comment in editor
                  editor.commands.setTextSelection({
                    from: comment.positionFrom,
                    to: comment.positionTo,
                  })
                  editor.commands.scrollIntoView()
                }}
              />
            ))}

            {/* Resolved comments */}
            {resolvedComments.length > 0 && (
              <>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-4">
                  Resolved
                </div>
                {resolvedComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    isOwner={comment.userId === user.id}
                    onResolve={() => onResolveComment(comment.id)}
                    onDelete={() => onDeleteComment(comment.id)}
                    resolved
                  />
                ))}
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

interface CommentCardProps {
  comment: CommentData
  isOwner: boolean
  onResolve: () => void
  onDelete: () => void
  onClick?: () => void
  resolved?: boolean
}

function CommentCard({
  comment,
  isOwner,
  onResolve,
  onDelete,
  onClick,
  resolved,
}: CommentCardProps) {
  const initials = comment.userName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
        resolved ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{comment.userName}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
          <div className="flex gap-2 mt-2">
            {!resolved && (
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  onResolve()
                }}
              >
                Resolve
              </button>
            )}
            {isOwner && (
              <button
                className="text-xs text-red-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
