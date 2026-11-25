/** Activity Log action recorded for each admin notification broadcast (the send history). */
export const BROADCAST_ACTION = 'NOTIFICATION_BROADCAST'

export interface BroadcastRecord {
  title: string
  message: string
  link: string | null
  audience: 'all' | 'level'
  level: string | null
  sent: number
}

export function parseBroadcastDetails(details: string | null): BroadcastRecord | null {
  try {
    const d = JSON.parse(details ?? '')
    return typeof d?.message === 'string' ? d : null
  } catch {
    return null
  }
}
