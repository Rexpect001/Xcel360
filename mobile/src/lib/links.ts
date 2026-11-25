import { Linking } from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { API_URL } from '@/lib/api'

/** The app screen for a thexcel360.com path, or null when the app has no such screen yet. */
export function appRouteFor(path: string): string | null {
  const p = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  const rules: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^\/(opportunities|jobs|internships)\/([a-z0-9]+)$/i, (m) => `/opportunity/${m[2]}`],
    [/^\/scholarships\/([a-z0-9-]+)$/i, (m) => `/topic/${m[1]}`],
    [/^\/(scholarships|opportunities|jobs|internships)$/, () => '/explore'],
    [/^\/dashboard\/tools\/(drafts)?$/, () => '/tools'],
    [/^\/dashboard\/tools\/([a-z-]+)$/, (m) => `/tool/${m[1]}`],
    [/^\/dashboard\/(tools|launchpad)$/, () => '/tools'],
    [/^\/dashboard\/(saved|applications|deadlines)$/, () => '/saved'],
    [/^\/dashboard\/notifications$/, () => '/notifications'],
    [/^\/dashboard\/(profile|billing)$/, () => '/me'],
    [/^\/(dashboard)?$/, () => '/home'],
    [/^\/(privacy|terms|contact)$/, (m) => `/info/${m[1]}`],
  ]
  for (const [re, to] of rules) {
    const m = p.match(re)
    if (m) return to(m)
  }
  return null
}

/**
 * Open a link from a notice, the legal pages or a listing. Xcel360 pages open
 * inside the app; mail opens the mail app; anything else opens in the in-app browser.
 */
export function openLink(href: string) {
  if (!href || href.startsWith('#')) return
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    Linking.openURL(href).catch(() => {})
    return
  }
  const sitePath = href.startsWith('/') ? href : href.replace(/^https?:\/\/(www\.)?thexcel360\.com/i, '')
  if (sitePath.startsWith('/')) {
    const route = appRouteFor(sitePath)
    if (route) { router.push(route as never); return }
    WebBrowser.openBrowserAsync(`${API_URL}${sitePath}`).catch(() => {})
    return
  }
  WebBrowser.openBrowserAsync(href).catch(() => {})
}
