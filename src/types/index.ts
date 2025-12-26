import { JSONContent } from '@tiptap/react'

export interface Document {
  id: string
  user_id: string
  title: string
  content: JSONContent | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  document_id: string
  user_id: string
  content: string
  resolved: boolean
  created_at: string
  // Client-side enrichment
  user_name?: string
  user_avatar?: string
}

export interface CommentThread {
  id: string
  comments: Comment[]
  position: {
    from: number
    to: number
  }
}

export interface Suggestion {
  id: string
  type: 'insert' | 'delete'
  content: string
  user_id: string
  user_name?: string
  created_at: string
}

export type EditorMode = 'editing' | 'suggesting' | 'viewing'
