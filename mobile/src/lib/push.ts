import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { api, post } from '@/lib/api'
import { getPref, setPref } from '@/lib/storage'

/**
 * Push notifications: deadline reminders, admin notices and other alerts arrive
 * on the phone with sound and vibration, even when the app is closed. Tapping
 * one opens the matching screen.
 */

// Show notices while the app is open, too
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
})

export type PushStatus = 'registered' | 'denied' | 'unsupported' | 'not-configured' | 'error'

const TOKEN_PREF = 'pushToken'

/** Android groups notifications by channel; this one buzzes and makes a sound. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('updates', {
    name: 'Scholarship updates',
    description: 'Deadline reminders and notices from Xcel360',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#2266b1',
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

/**
 * Ask for permission (once), get this phone's push token and register it for
 * the signed-in student. Safe to call on every launch.
 */
export async function registerForPush(): Promise<PushStatus> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported'
    await ensureChannel()
    const current = await Notifications.getPermissionsAsync()
    let granted = current.granted
    if (!granted && current.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted
    if (!granted) return 'denied'

    // Push tokens are issued per Expo project (set up with `eas init`)
    const projectId = (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId
    if (!projectId) return 'not-configured'

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await api('/push', post({ token, platform: Platform.OS }))
    await setPref(TOKEN_PREF, token)
    return 'registered'
  } catch (error) {
    console.warn('[push] registration failed', error)
    return 'error'
  }
}

/** Stop pushes to this phone (on sign-out). */
export async function unregisterPush() {
  const token = await getPref(TOKEN_PREF)
  if (!token) return
  await api(`/push?token=${encodeURIComponent(token)}`, { method: 'DELETE' }).catch(() => {})
  await setPref(TOKEN_PREF, '')
}

/** Keep the app-icon badge in step with unread notifications. */
export function setBadge(count: number) {
  if (Platform.OS === 'web') return
  Notifications.setBadgeCountAsync(count).catch(() => {})
}

/** Screen to open for a notification tap (the server puts it in data.route). */
export function routeFrom(response: Notifications.NotificationResponse | null | undefined): string | null {
  const route = response?.notification.request.content.data?.route
  return typeof route === 'string' && route.startsWith('/') ? route : null
}
