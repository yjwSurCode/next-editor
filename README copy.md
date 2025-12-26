# Google Docs-Style Markdown Editor

A web app that replicates core Google Docs features with markdown support. Built with Next.js, Tiptap, and Supabase.

## Features

- **WYSIWYG Markdown Editing**: Import markdown, edit visually like Google Docs
- **Comments**: Google Docs-style commenting with sidebar
- **Suggested Edits**: Track changes with accept/reject (Suggesting mode)
- **Google OAuth**: Sign in with Google via Supabase Auth
- **Auto-save**: Documents save automatically as you type
- **Markdown Export**: Export documents with or without comments/suggestions
- **LLM-Friendly Format**: Export includes structured annotations for AI consumption

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Editor**: Tiptap (ProseMirror-based)
- **Auth/Database**: Supabase (Google OAuth + PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel-ready

## Setup

### 1. Clone and Install

```bash
git clone <repo>
cd <project>
yarn install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your URL and anon key
3. Go to **Authentication > Providers** and enable Google OAuth
4. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Database

Run the schema in Supabase SQL Editor (found in `supabase/schema.sql`):

```sql
-- Creates documents and comments tables with RLS policies
```

### 4. Configure Google OAuth in Supabase

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Add Client ID and Secret in Supabase Auth settings

### 5. Run Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Editor Modes

- **Editing**: Normal editing mode
- **Suggesting**: Changes are tracked (green = insertions, red = deletions)
- **Viewing**: Read-only mode

### Keyboard Shortcuts

Same as Google Docs:
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + U`: Underline
- `Ctrl/Cmd + Shift + 7`: Numbered list
- `Ctrl/Cmd + Shift + 8`: Bullet list

### Importing Markdown

- Click **File > Import Markdown**
- Or drag and drop a `.md` file
- Or paste markdown directly

### Exporting

- **Copy as Markdown**: Clean markdown
- **Copy with Comments**: Includes comment annotations
- **Download as Markdown**: Save to file
- **Download with Comments**: Full export with LLM-readable annotations

## LLM Export Format

Exports include structured annotations:

```markdown
<!--
DOCUMENT METADATA FOR LLM:
- Total comments: 2
- Active comments: 2
...
-->

# My Document

Here is some text<!-- COMMENT_REF[abc123] -->.

This has a <!-- SUGGESTION(insert): new addition -->.

---

## Comments

- **[abc123]**: "This needs clarification" - *John Doe*
```

## Project Structure

```
src/
├── app/
│   ├── login/           # Auth pages
│   ├── doc/[id]/        # Document editor
│   └── page.tsx         # Dashboard
├── components/
│   ├── editor/          # Tiptap editor components
│   ├── documents/       # Document list
│   └── ui/              # shadcn components
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── editor/          # Tiptap extensions
│   └── markdown.ts      # MD import/export
└── types/
```

## Deployment

### Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

## License

MIT
