import { loadFont as loadJakarta } from '@remotion/google-fonts/PlusJakartaSans'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'

export const display = loadJakarta('normal', { weights: ['600', '700', '800'], subsets: ['latin'] }).fontFamily
export const sans = loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily

// Mirrors tailwind.config.ts in the web app so the videos match the product.
export const c = {
  brand50: '#eef5fc',
  brand100: '#dbeaf8',
  brand200: '#b8d4f1',
  brand500: '#337cc6',
  brand600: '#2266b1',
  brand700: '#1d579a',
  brand800: '#1a4880',
  brand950: '#0e2643',
  accent100: '#e3f1fd',
  accent200: '#cbe6fb',
  accent400: '#41a5ee',
  ink900: '#131c2b',
  ink800: '#1f2a3c',
  ink600: '#3c4b62',
  ink500: '#4d5d75',
  ink400: '#5f6f86',
  ink300: '#a3b1c4',
  ink200: '#d8e0ea',
  surface50: '#f5f8fc',
  surface100: '#ebf1f8',
  surface200: '#dbe4ef',
  white: '#ffffff',
  amber50: '#fffbeb',
  amber600: '#d97706',
  amber700: '#b45309',
  violet50: '#f5f3ff',
  violet600: '#7c3aed',
  green50: '#ecfdf5',
  green600: '#059669',
  green700: '#047857',
  red50: '#fef2f2',
  red600: '#dc2626',
}

export const FPS = 30
export const s = (seconds: number) => Math.round(seconds * FPS)
