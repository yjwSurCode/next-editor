import { marked } from 'marked'
import TurndownService from 'turndown'

// Configure marked for parsing markdown to HTML
marked.setOptions({
  gfm: true,
  breaks: true,
})

// Configure turndown for converting HTML to markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Configure turndown with annotations for LLM export
const turndownWithAnnotations = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Add rules for strikethrough
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'] as (keyof HTMLElementTagNameMap)[],
  replacement: (content) => `~~${content}~~`,
})

// Add rules for underline (non-standard markdown, preserve as HTML)
turndownService.addRule('underline', {
  filter: 'u',
  replacement: (content) => `<u>${content}</u>`,
})

// Add rules for track changes - insertions
turndownWithAnnotations.addRule('trackInsert', {
  filter: (node) => {
    return node.nodeName === 'SPAN' && node.classList.contains('track-insert')
  },
  replacement: (content) => `<!-- SUGGESTION(insert): ${content} -->`,
})

// Add rules for track changes - deletions
turndownWithAnnotations.addRule('trackDelete', {
  filter: (node) => {
    return node.nodeName === 'SPAN' && node.classList.contains('track-delete')
  },
  replacement: (content) => `<!-- SUGGESTION(delete): ${content} -->`,
})

// Add rules for comments
turndownWithAnnotations.addRule('comment', {
  filter: (node) => {
    return node.nodeName === 'SPAN' && node.classList.contains('comment-highlight')
  },
  replacement: (content, node) => {
    const commentId = (node as HTMLElement).getAttribute('data-comment-id')
    return `${content}<!-- COMMENT_REF[${commentId}] -->`
  },
})

// Add standard rules to annotated turndown
turndownWithAnnotations.addRule('strikethrough', {
  filter: ['del', 's', 'strike'] as (keyof HTMLElementTagNameMap)[],
  replacement: (content) => `~~${content}~~`,
})

turndownWithAnnotations.addRule('underline', {
  filter: 'u',
  replacement: (content) => `<u>${content}</u>`,
})

/**
 * Convert markdown string to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  return await marked.parse(markdown)
}

/**
 * Convert HTML to markdown string (clean, no annotations)
 */
export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html)
}

/**
 * Convert HTML to markdown with inline annotations for LLM consumption
 */
export function htmlToMarkdownWithAnnotations(html: string): string {
  return turndownWithAnnotations.turndown(html)
}

/**
 * Detect if pasted content looks like markdown
 */
export function looksLikeMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers
    /^\s*[-*+]\s/m, // Unordered lists
    /^\s*\d+\.\s/m, // Ordered lists
    /\*\*.+\*\*/m, // Bold
    /\*.+\*/m, // Italic
    /`[^`]+`/, // Inline code
    /```[\s\S]*```/, // Code blocks
    /^\s*>/m, // Blockquotes
    /\[.+\]\(.+\)/, // Links
    /!\[.+\]\(.+\)/, // Images
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}

export interface CommentData {
  id: string
  content: string
  author?: string
  resolved?: boolean
}

export interface SuggestionData {
  id: string
  type: 'insert' | 'delete'
  content: string
  author?: string
}

/**
 * Export Tiptap content to markdown with comprehensive annotations for LLM
 *
 * Format:
 * - Inline suggestions: <!-- SUGGESTION(insert/delete): content -->
 * - Comment references: text<!-- COMMENT_REF[id] -->
 * - Comment details in footer section
 *
 * This format is designed to be:
 * 1. Easily parseable by LLMs
 * 2. Human-readable
 * 3. Preserves the relationship between comments and their locations
 */
export function exportToMarkdownWithAnnotations(
  html: string,
  comments: CommentData[] = [],
  suggestions: SuggestionData[] = []
): string {
  // Convert HTML to markdown with inline annotations
  let markdown = htmlToMarkdownWithAnnotations(html)

  // Build footer section with detailed comment/suggestion info
  const sections: string[] = []

  // Add active comments
  const activeComments = comments.filter((c) => !c.resolved)
  if (activeComments.length > 0) {
    const commentSection = [
      '',
      '---',
      '',
      '## Comments',
      '',
      ...activeComments.map((c) =>
        `- **[${c.id.slice(0, 8)}]**: "${c.content}"${c.author ? ` — *${c.author}*` : ''}`
      ),
    ].join('\n')
    sections.push(commentSection)
  }

  // Add resolved comments (if any)
  const resolvedComments = comments.filter((c) => c.resolved)
  if (resolvedComments.length > 0) {
    const resolvedSection = [
      '',
      '## Resolved Comments',
      '',
      ...resolvedComments.map((c) =>
        `- ~~[${c.id.slice(0, 8)}]: "${c.content}"${c.author ? ` — *${c.author}*` : ''}~~`
      ),
    ].join('\n')
    sections.push(resolvedSection)
  }

  // Add pending suggestions if tracked separately
  if (suggestions.length > 0) {
    const suggestionSection = [
      '',
      '## Pending Suggestions',
      '',
      ...suggestions.map((s) =>
        `- **${s.type.toUpperCase()}** [${s.id.slice(0, 8)}]: "${s.content}"${s.author ? ` — *${s.author}*` : ''}`
      ),
    ].join('\n')
    sections.push(suggestionSection)
  }

  // Add metadata header for LLM context
  const metadata = [
    '<!--',
    'DOCUMENT METADATA FOR LLM:',
    `- Total comments: ${comments.length}`,
    `- Active comments: ${activeComments.length}`,
    `- Resolved comments: ${resolvedComments.length}`,
    `- Pending suggestions: ${suggestions.length}`,
    '',
    'ANNOTATION FORMAT:',
    '- <!-- SUGGESTION(insert): text --> = Suggested insertion',
    '- <!-- SUGGESTION(delete): text --> = Suggested deletion',
    '- <!-- COMMENT_REF[id] --> = Reference to comment with given ID',
    '-->',
    '',
  ].join('\n')

  return metadata + markdown + sections.join('\n')
}

/**
 * Generate Tiptap-compatible HTML from markdown
 */
export async function markdownToTiptap(markdown: string): Promise<string> {
  const html = await markdownToHtml(markdown)
  return html
}
