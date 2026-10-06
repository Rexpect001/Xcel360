'use client'

import { useEffect, useState } from 'react'
import AnnouncementBar from './AnnouncementBar'
import EdifierAdPopup from '@/components/ui/EdifierAdPopup'

export interface PublicSettingsData {
  announcement: { enabled: boolean; text: string; link: string; linkLabel: string }
  edifierAdEnabled: boolean
}

export default function PublicSettings({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettingsData | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/settings/public', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then(setSettings)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <>
      <AnnouncementBar announcement={settings?.announcement ?? null} />
      {children}
      <EdifierAdPopup enabled={settings?.edifierAdEnabled ?? false} />
    </>
  )
}
