import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { DocumentList } from '@/components/documents/DocumentList'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  console.log(supabase.auth.getUser(),'supabase.auth.getUser()')

  if (!user) {
    redirect('/login')
    // console.log(supabase.auth.getUser(),'supabase.auth.getUser()')
    // return
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-5xl mx-auto py-8 px-4">
        <DocumentList documents={documents || []} />
      </main>
    </div>
  )
}
