import { useColorScheme } from 'react-native'

/**
 * Xcel360 brand colours (from the website's tailwind.config.ts). Each token has
 * one job, and every text/background pair was measured against WCAG 2.1:
 * text 4.5:1 or better, icons and large text 3:1 or better, in light and dark.
 */
const light = {
  bg: '#f5f8fc',          // page
  surface: '#ffffff',     // cards, sheets, tab bar
  line: '#dbe4ef',        // borders, dividers
  text: '#131c2b',        // 16.0:1 on page
  muted: '#526279',       // 5.8:1 on page, 6.2:1 on card
  placeholder: '#5f6e85', // 5.2:1 on card (was 2.2:1)
  brand: '#2266b1',       // button / chip fill (white text 5.8:1), brand icons
  onBrand: '#ffffff',
  link: '#2266b1',        // link text (5.5:1 on page)
  hero: '#1a4880',        // dark-blue panels (white 9.2:1)
  heroDeep: '#0e2643',    // welcome gradient top
  onHero: '#ffffff',
  onHeroMuted: '#dbeaf8', // 7.5:1 on hero
  tint: '#eef5fc',        // soft blue surface
  onTint: '#1a4880',      // 8.4:1 on tint
  ok: '#047857', okSoft: '#ecfdf5',     // 5.2:1
  warn: '#b45309', warnSoft: '#fffbeb', // 4.8:1
  bad: '#b91c1c', badSoft: '#fef2f2',   // 5.9:1
  shadow: '#0e2643',
}

const dark: typeof light = {
  bg: '#0b111c',
  surface: '#131c2b',
  line: '#253144',
  text: '#edf1f6',        // 16.7:1
  muted: '#a3b1c4',       // 7.9:1 on card
  placeholder: '#8a99ae', // 5.9:1 on card
  brand: '#2266b1',       // keeps white text at 5.8:1 (a lighter blue fell to 3.2:1)
  onBrand: '#ffffff',
  link: '#8ab7e6',        // 9.0:1 on page
  hero: '#163b67',        // white 11.3:1
  heroDeep: '#0b1a30',
  onHero: '#ffffff',
  onHeroMuted: '#dbeaf8', // 9.2:1
  tint: '#14243a',
  onTint: '#b8d4f1',      // 10.2:1
  ok: '#34d399', okSoft: '#0f2a22',
  warn: '#fbbf24', warnSoft: '#2a2110',
  bad: '#f87171', badSoft: '#2a1414',
  shadow: '#000000',
}

export type Palette = typeof light

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light
}

/**
 * Type roles. Space Grotesk everywhere: Bold (its heaviest weight) for
 * headings, buttons, chips and numbers; Regular/Medium for reading text.
 */
export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  display: 'SpaceGrotesk_700Bold',
  displayHeavy: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 }
/** Minimum touch target (Apple HIG / Material): 44 points. */
export const TOUCH = 44
