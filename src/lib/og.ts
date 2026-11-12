/**
 * Default link-preview image (WhatsApp, Facebook, LinkedIn, X...). A static
 * JPEG under 300 KB, since WhatsApp skips larger preview images.
 *
 * A page that sets its own `openGraph` replaces the root one entirely, so
 * pages must include this explicitly when they have no image of their own.
 */
export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Xcel360 - Find fully funded scholarships you qualify for',
}
