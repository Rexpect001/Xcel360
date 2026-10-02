import { cn } from '@/lib/utils'

/**
 * The Xcel line pattern (chevrons + drops) from the brand files, tiled as a
 * subtle texture behind blue surfaces. Place inside a `relative` parent; put
 * content in a sibling with `relative` so it sits above the pattern.
 */
export default function BrandPattern({ className, opacity = 0.16 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: "url('/brand/pattern.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: '300px auto',
        opacity,
      }}
    />
  )
}
