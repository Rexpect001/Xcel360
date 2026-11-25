import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { Session } from '@/lib/types'

/**
 * Tokens live in the phone's secure storage (Keychain / Keystore). The browser
 * preview falls back to localStorage, which is fine for development only.
 */
const SESSION_KEY = 'xcel360.session.v1'
const listeners = new Set<() => void>()

/** Called when the session is cleared anywhere (sign-out, or a refresh the server refused). */
export function onSessionCleared(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

async function getItem(key: string) {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null
  return SecureStore.getItemAsync(key)
}
async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') { globalThis.localStorage?.setItem(key, value); return }
  await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
}
async function removeItem(key: string) {
  if (Platform.OS === 'web') { globalThis.localStorage?.removeItem(key); return }
  await SecureStore.deleteItemAsync(key)
}

export async function getStoredSession(): Promise<Session | null> {
  const value = await getItem(SESSION_KEY).catch(() => null)
  if (!value) return null
  try { return JSON.parse(value) as Session } catch { await removeItem(SESSION_KEY); return null }
}
export async function storeSession(session: Session) {
  await setItem(SESSION_KEY, JSON.stringify(session))
}
export async function clearStoredSession() {
  await removeItem(SESSION_KEY).catch(() => {})
  listeners.forEach((fn) => fn())
}

/** Small per-device preferences (e.g. "welcome seen"). Never throws. */
export async function getPref(key: string) {
  try { return await getItem(`xcel360.pref.${key}`) } catch { return null }
}
export async function setPref(key: string, value: string) {
  try { await setItem(`xcel360.pref.${key}`, value) } catch { /* best effort */ }
}
