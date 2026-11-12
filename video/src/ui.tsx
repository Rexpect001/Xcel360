import React from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { c, display, sans } from './theme'

/* ---------- motion helpers ---------- */

/** 0 -> 1 spring that starts `delay` frames into the current sequence. */
export function useIn(delay = 0, damping = 200) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - delay, fps, config: { damping } })
}

export const rise = (p: number, dist = 40): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dist}px)`,
})

export const pop = (p: number): React.CSSProperties => ({
  opacity: Math.min(1, p * 1.5),
  transform: `scale(${0.85 + 0.15 * p})`,
})

/** Linear 0 -> 1 between two frames, clamped and eased. */
export function useProgress(from: number, to: number) {
  const frame = useCurrentFrame()
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })
}

/** Characters of `text` typed so far, starting at `start` at `cps` chars per second. */
export function useTyped(text: string, start: number, cps = 32) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps))
  return text.slice(0, n)
}

export function useCount(to: number, start: number, dur: number) {
  const p = useProgress(start, start + dur)
  return Math.round(to * p)
}

/* ---------- surfaces ---------- */

export const Panel: React.FC<{ style?: React.CSSProperties; dark?: boolean; children?: React.ReactNode }> = ({ style, dark, children }) => (
  <div
    style={{
      background: dark ? c.ink900 : c.white,
      borderRadius: 28,
      boxShadow: dark
        ? '0 30px 60px -20px rgba(14,38,67,0.55)'
        : '0 1px 2px rgba(19,28,43,0.05), 0 24px 50px -24px rgba(19,28,43,0.25)',
      border: `1.5px solid ${dark ? c.ink800 : c.surface200}`,
      color: dark ? c.white : c.ink900,
      fontFamily: sans,
      ...style,
    }}
  >
    {children}
  </div>
)

type Tone = 'slate' | 'blue' | 'amber' | 'violet' | 'green' | 'red'
const TONES: Record<Tone, [string, string]> = {
  slate: [c.surface100, c.ink600],
  blue: [c.brand50, c.brand700],
  amber: [c.amber50, c.amber700],
  violet: [c.violet50, c.violet600],
  green: [c.green50, c.green700],
  red: [c.red50, c.red600],
}

export const Pill: React.FC<{ tone?: Tone; children: React.ReactNode; size?: number; dot?: boolean; style?: React.CSSProperties }> = ({
  tone = 'blue', children, size = 18, dot = true, style,
}) => {
  const [bg, fg] = TONES[tone]
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: size * 0.45, background: bg, color: fg,
        borderRadius: 999, padding: `${size * 0.4}px ${size * 0.8}px`, fontSize: size, fontWeight: 700,
        fontFamily: sans, whiteSpace: 'nowrap', ...style,
      }}
    >
      {dot && <span style={{ width: size * 0.4, height: size * 0.4, borderRadius: 99, background: fg }} />}
      {children}
    </span>
  )
}

export const Heading: React.FC<{ size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  size = 34, color = c.ink900, children, style,
}) => (
  <div style={{ fontFamily: display, fontWeight: 800, fontSize: size, color, letterSpacing: '-0.02em', lineHeight: 1.15, ...style }}>
    {children}
  </div>
)

/** Grey placeholder text line used inside generated documents. */
export const Line: React.FC<{ w: number | string; p?: number; h?: number; color?: string }> = ({ w, p = 1, h = 12, color = c.surface200 }) => (
  <div style={{ height: h, borderRadius: 99, background: color, width: typeof w === 'number' ? w * p : `calc(${w} * ${p})`, marginBottom: 12 }} />
)

/** Mouse pointer moving through [frame, x, y] keyframes, with click pulses. */
export const Cursor: React.FC<{ path: [number, number, number][]; clicks?: number[] }> = ({ path, clicks = [] }) => {
  const frame = useCurrentFrame()
  const frames = path.map((p) => p[0])
  const opt = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: Easing.inOut(Easing.cubic) }
  const x = interpolate(frame, frames, path.map((p) => p[1]), opt)
  const y = interpolate(frame, frames, path.map((p) => p[2]), opt)
  const press = clicks.some((cf) => frame >= cf && frame < cf + 6)
  const ring = clicks.map((cf) => interpolate(frame, [cf, cf + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const visible = frame >= path[0][0]
  if (!visible) return null
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 50, pointerEvents: 'none' }}>
      {ring.map((r, i) => r > 0 && r < 1 && (
        <div key={i} style={{ position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: 99, border: `3px solid ${c.brand500}`, opacity: 1 - r, transform: `scale(${0.4 + r})` }} />
      ))}
      <svg width="34" height="34" viewBox="0 0 24 24" style={{ transform: `scale(${press ? 0.85 : 1})`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
        <path d="M4 2 L4 19 L9 14.5 L12.5 22 L15.5 20.6 L12 13.2 L18.5 13.2 Z" fill={c.ink900} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export const Logo: React.FC<{ white?: boolean; height?: number }> = ({ white, height = 44 }) => (
  <Img src={staticFile(white ? 'xcel-white.png' : 'xcel-blue.png')} style={{ height }} />
)

/* ---------- caption ---------- */

/** Script line revealed word by word, current word highlighted. Works muted (most social autoplay). */
export const Caption: React.FC<{ text: string; dur: number; size: number; dark: boolean; maxWidth: number }> = ({ text, dur, size, dark, maxWidth }) => {
  const frame = useCurrentFrame()
  const words = text.split(' ')
  const revealEnd = Math.max(20, dur * 0.68 - 10)
  const per = revealEnd / words.length
  const enter = useIn(0)
  return (
    <div style={{ maxWidth, textAlign: 'center', fontFamily: display, fontWeight: 700, fontSize: size, lineHeight: 1.25, letterSpacing: '-0.015em', ...rise(enter, 20) }}>
      {words.map((w, i) => {
        const t = frame - (6 + i * per)
        const shown = interpolate(t, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const current = t >= 0 && t < per + 4
        return (
          <span
            key={i}
            style={{
              opacity: 0.18 + 0.82 * shown,
              color: current ? (dark ? c.accent200 : c.brand600) : dark ? c.white : c.ink900,
              display: 'inline-block',
              marginRight: size * 0.26,
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}

/* ---------- backgrounds ---------- */

export const Backdrop: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame()
  const drift = Math.sin(frame / 60) * 40
  return (
    <AbsoluteFill
      style={{
        background: dark
          ? `linear-gradient(150deg, ${c.brand600} 0%, ${c.brand700} 55%, ${c.brand950} 100%)`
          : `linear-gradient(180deg, ${c.surface100} 0%, #e4ecf6 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute', width: 900, height: 900, borderRadius: 999, right: -250 + drift, top: -350,
          background: dark ? 'rgba(65,165,238,0.28)' : 'rgba(34,102,177,0.10)', filter: 'blur(120px)',
        }}
      />
      <div
        style={{
          position: 'absolute', width: 700, height: 700, borderRadius: 999, left: -250 - drift, bottom: -300,
          background: dark ? 'rgba(203,230,251,0.12)' : 'rgba(65,165,238,0.12)', filter: 'blur(120px)',
        }}
      />
    </AbsoluteFill>
  )
}
