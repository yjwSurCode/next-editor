'use client'

import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'

interface SuggestionsBubbleProps {
  editor: Editor
}

export function SuggestionsBubble({ editor }: SuggestionsBubbleProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updatePosition = () => {
      const isInsert = editor.isActive('trackInsert')
      const isDelete = editor.isActive('trackDelete')

      if (!isInsert && !isDelete) {
        setIsVisible(false)
        return
      }

      const { from, to } = editor.state.selection
      if (from === to) {
        setIsVisible(false)
        return
      }

      // Get the position of the selection
      const domSelection = window.getSelection()
      if (!domSelection || domSelection.rangeCount === 0) {
        setIsVisible(false)
        return
      }

      const range = domSelection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setPosition({
        top: rect.top - 40,
        left: rect.left + rect.width / 2 - 75,
      })
      setIsVisible(true)
    }

    editor.on('selectionUpdate', updatePosition)
    editor.on('transaction', updatePosition)

    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('transaction', updatePosition)
    }
  }, [editor])

  const isInsert = editor.isActive('trackInsert')
  const isDelete = editor.isActive('trackDelete')

  const handleAccept = () => {
    if (isInsert) {
      editor.chain().focus().unsetMark('trackInsert').run()
    } else if (isDelete) {
      editor.chain().focus().deleteSelection().run()
    }
  }

  const handleReject = () => {
    if (isInsert) {
      editor.chain().focus().deleteSelection().run()
    } else if (isDelete) {
      editor.chain().focus().unsetMark('trackDelete').run()
    }
  }

  if (!isVisible || !position) {
    return null
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1"
      style={{ top: position.top, left: position.left }}
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={handleAccept}
      >
        <CheckIcon className="h-4 w-4 mr-1" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleReject}
      >
        <XIcon className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
