'use client'

import { useRef, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { markdownToHtml, htmlToMarkdown, exportToMarkdownWithAnnotations } from '@/lib/markdown'
import { toast } from 'sonner'

interface ImportExportMenuProps {
  editor: Editor
  documentTitle: string
}

export function ImportExportMenu({ editor, documentTitle }: ImportExportMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      const html = await markdownToHtml(text)
      editor.commands.setContent(html)
      toast.success('Markdown imported successfully')

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [editor]
  )

  const handleCopyMarkdown = useCallback(async () => {
    const html = editor.getHTML()
    const markdown = htmlToMarkdown(html)
    await navigator.clipboard.writeText(markdown)
    toast.success('Markdown copied to clipboard')
  }, [editor])

  const handleCopyMarkdownWithAnnotations = useCallback(async () => {
    const html = editor.getHTML()
    // For now, we pass empty arrays for comments/suggestions
    // These will be populated when we integrate those features
    const markdown = exportToMarkdownWithAnnotations(html, [], [])
    await navigator.clipboard.writeText(markdown)
    toast.success('Markdown with annotations copied to clipboard')
  }, [editor])

  const handleDownloadMarkdown = useCallback(() => {
    const html = editor.getHTML()
    const markdown = htmlToMarkdown(html)

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Markdown downloaded')
  }, [editor, documentTitle])

  const handleDownloadWithAnnotations = useCallback(() => {
    const html = editor.getHTML()
    const markdown = exportToMarkdownWithAnnotations(html, [], [])

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_annotated.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Annotated markdown downloaded')
  }, [editor, documentTitle])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            File
            <svg
              className="ml-1 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Import Markdown
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyMarkdown}>
            <CopyIcon className="mr-2 h-4 w-4" />
            Copy as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyMarkdownWithAnnotations}>
            <CopyIcon className="mr-2 h-4 w-4" />
            Copy with Comments
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadMarkdown}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadWithAnnotations}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download with Comments
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
