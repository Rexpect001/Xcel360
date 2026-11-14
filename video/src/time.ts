import { useCurrentFrame as useRemotionFrame } from 'remotion'

/**
 * Playback speed for every scene. Scenes are designed on a 30 fps "design clock";
 * this multiplies it, so 1.4 plays everything 40% faster (cursor moves, typing,
 * springs, counters) and scene lengths shrink to match. Change it here only.
 */
export const SPEED = 1.4

/** Current frame on the design clock (may be fractional). Use instead of Remotion's. */
export function useCurrentFrame(): number {
  return useRemotionFrame() * SPEED
}

/** Real frames a scene designed for `designFrames` takes at SPEED. */
export const realFrames = (designFrames: number) => Math.round(designFrames / SPEED)
