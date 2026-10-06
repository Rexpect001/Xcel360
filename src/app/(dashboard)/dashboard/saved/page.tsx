import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SavedPipeline from '@/components/dashboard/SavedPipeline'

export const dynamic = 'force-dynamic'

export default async function SavedPage() {
  const session = await getAuth()
  if (!session) redirect('/signin')
  return <SavedPipeline />
}
