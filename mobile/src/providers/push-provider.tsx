import { useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import { registerForPush, routeFrom } from '@/lib/push'

/**
 * Wires push notifications into the app:
 * - registers the phone when a student is signed in,
 * - opens the right screen when a notification is tapped (also from a cold start),
 * - refreshes the notification list and badge when one arrives or the app returns.
 */
export function PushProvider() {
  // Push only exists on phones; the web preview has no notification module
  return Platform.OS === 'web' ? null : <PhonePush />
}

function PhonePush() {
  const { status } = useAuth()
  const qc = useQueryClient()
  const handled = useRef<string | null>(null)
  const lastResponse = Notifications.useLastNotificationResponse()

  useEffect(() => {
    if (status === 'authenticated') void registerForPush()
  }, [status])

  // A tapped notification, whether it launched the app or brought it forward.
  // Each one is opened once (the hook keeps returning the last response).
  useEffect(() => {
    if (!lastResponse) return
    const id = lastResponse.notification.request.identifier
    if (handled.current === id) return
    handled.current = id
    const route = routeFrom(lastResponse)
    if (route) setTimeout(() => router.push(route as never), 300)
  }, [lastResponse])

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['me'] })
    })
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') qc.invalidateQueries({ queryKey: ['notifications'] })
    })
    return () => { received.remove(); appState.remove() }
  }, [qc])

  return null
}
