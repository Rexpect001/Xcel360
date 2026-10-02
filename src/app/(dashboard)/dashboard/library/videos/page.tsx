export const revalidate = 21600
import { Youtube } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import ProNotice from '@/components/dashboard/ProNotice'
import VideoGrid from '@/components/dashboard/VideoGrid'
import { getChannelVideos, CHANNEL_URL } from '@/lib/youtube'

export default async function VideoHubPage() {
  const videos = await getChannelVideos(15)
  return (
    <div>
      <DashHeader
        eyebrow="Resources"
        title="Video hub"
        pro
        subtitle="Information sessions, CV and SOP clinics, and scholarship Q&As from the Xcel360 channel."
        actions={
          <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost border border-surface-200">
            <Youtube className="h-4 w-4 text-red-600" /> Open channel
          </a>
        }
      />
      <ProNotice />
      {videos.length === 0 ? (
        <div className="paper-card p-10 text-center text-ink-500">
          Videos could not be loaded right now.{' '}
          <a href={CHANNEL_URL} className="font-semibold text-brand-700 underline" target="_blank" rel="noopener noreferrer">
            Watch on YouTube
          </a>
          .
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  )
}
