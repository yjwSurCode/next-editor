'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Editor } from '@tiptap/react'
import { EditorMode } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ImportExportMenu } from './ImportExportMenu'

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  user: User
  saveStatus: 'saved' | 'saving' | 'unsaved'
  editorMode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onDelete: () => void
  editor: Editor
  showComments: boolean
  onToggleComments: () => void
}

export function EditorHeader({
  title,
  onTitleChange,
  user,
  saveStatus,
  editorMode,
  onModeChange,
  onDelete,
  editor,
  showComments,
  onToggleComments,
}: EditorHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(title)

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
    if (localTitle !== title) {
      onTitleChange(localTitle)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || '?'

  const saveStatusText = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
  }

  const modeButtonClass = (mode: EditorMode) =>
    `px-3 py-1 text-sm rounded-full transition-colors ${
      editorMode === mode
        ? 'bg-blue-100 text-blue-700'
        : 'hover:bg-gray-100 text-gray-600'
    }`

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Button>

          {isEditingTitle ? (
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleBlur()
              }}
              className="text-lg font-medium w-64"
              autoFocus
            />
          ) : (
            <h1
              className="text-lg font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h1>
          )}

          <span className="text-sm text-gray-400">{saveStatusText[saveStatus]}</span>

          <ImportExportMenu editor={editor} documentTitle={title} />
        </div>

        <div className="flex items-center gap-4">
          {/* Comments toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleComments}
            className={showComments ? 'text-blue-600' : 'text-gray-600'}
          >
            <CommentIcon className="h-5 w-5" />
          </Button>

          {/* Mode switcher */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
            <button
              className={modeButtonClass('editing')}
              onClick={() => onModeChange('editing')}
            >
              Editing
            </button>
            <button
              className={modeButtonClass('suggesting')}
              onClick={() => onModeChange('suggesting')}
            >
              Suggesting
            </button>
            <button
              className={modeButtonClass('viewing')}
              onClick={() => onModeChange('viewing')}
            >
              Viewing
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Delete document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
