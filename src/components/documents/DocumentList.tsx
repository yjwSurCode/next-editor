'use client'

import { Document } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatDistanceToNow } from '@/lib/date'

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateDocument = async () => {
    setIsCreating(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: 'Untitled Document',
          content: null,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        router.push(`/doc/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenDocument = (id: string) => {
    router.push(`/doc/${id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your Documents</h2>
        <Button onClick={handleCreateDocument} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'New Document'}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No documents yet</p>
          <Button onClick={handleCreateDocument} disabled={isCreating}>
            Create your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenDocument(doc.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                <CardDescription>
                  {formatDistanceToNow(doc.updated_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-100 rounded flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
