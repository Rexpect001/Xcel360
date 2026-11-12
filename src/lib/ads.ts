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

/**
 * In-article ad breaks: one after the 3rd paragraph, a second after the 10th
 * on long articles. Short pieces get none so ads never outweigh the content.
 */
export function isArticleAdBreak(index: number, total: number) {
  return (index === 2 && total > 4) || (index === 9 && total > 13)
}
