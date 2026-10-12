/**
 * Google AdSense config shared by the root layout (script + meta tag) and
 * the GoogleAd component.
 *
 * The publisher id is public (it appears in page source and ads.txt), so it
 * is safe as a fallback. Ads only load in production builds, so local dev
 * clicks never count as invalid traffic. Set NEXT_PUBLIC_ADS_DISABLED=true to
 * switch them off without a code change.
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-7270136170155691'

export const ADS_ENABLED =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ADS_DISABLED !== 'true'
