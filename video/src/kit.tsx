/**
 * Building blocks shared by the Nov 2026 "what's new" series (platform, smartai,
 * tracker, mentorship, writing). They mirror the current product UI: logo blue
 * #2266b1, deep-blue hero gradient, compact circular stat strip, credit meter.
 */
import React from 'react'
import { interpolate, Easing } from 'remotion'
import { useCurrentFrame } from './time'
import { ArrowRight, Bookmark, CalendarClock, Check, Coins, Gift, Globe, GraduationCap, Lock, MapPin } from 'lucide-react'
import { c, display, sans } from './theme'
import { Heading, Logo, Panel, Pill, pop, rise, useIn, useProgress } from './ui'

export const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

/** 0 -> 1 between two frames with a soft overshoot, for things that land. */
export function useLand(from: number, dur = 16) {
  const frame = useCurrentFrame()
  return interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) })
}

/** Browser window with an address bar, so viewers know it is the website. */
export const Browser: React.FC<{ url: string; width?: number; height?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  url, width = 1100, height = 680, style, children,
}) => (
  <Panel style={{ width, height, padding: 0, overflow: 'hidden', borderRadius: 22, ...style }}>
    <div style={{ height: 52, background: c.surface50, borderBottom: `1.5px solid ${c.surface200}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
      {['#f87171', '#fbbf24', '#34d399'].map((col) => <span key={col} style={{ width: 13, height: 13, borderRadius: 99, background: col }} />)}
      <div style={{ marginLeft: 14, flex: 1, height: 32, borderRadius: 10, background: c.white, border: `1.5px solid ${c.surface200}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 16, color: c.ink600, fontFamily: sans }}>
        <Lock size={14} color={c.green600} /> thexcel360.com<span style={{ color: c.ink400 }}>{url}</span>
      </div>
    </div>
    <div style={{ position: 'relative', height: height - 52 }}>{children}</div>
  </Panel>
)

/** Deep-blue page header strip as on the live site. */
export const HeroStrip: React.FC<{ title: string; sub?: string; height?: number }> = ({ title, sub, height = 150 }) => (
  <div style={{ height, background: 'linear-gradient(160deg, #163b67 0%, #1a4880 40%, #1d579a 75%, #2266b1 100%)', padding: '30px 36px', color: c.white }}>
    <Heading size={34} color={c.white}>{title}</Heading>
    {sub && <div style={{ fontFamily: sans, fontSize: 18, color: c.brand100, marginTop: 8 }}>{sub}</div>}
  </div>
)

export interface Listing {
  title: string
  org: string
  country: string
  level: string
  funding: string
  deadline: string
  match?: number
}

/** Opportunity card in the site's "snapshot" style. */
export const ListingCard: React.FC<{ o: Listing; width?: number; style?: React.CSSProperties; saved?: boolean; showMatch?: number }> = ({
  o, width = 330, style, saved, showMatch = 1,
}) => (
  <Panel style={{ width, padding: 20, borderRadius: 20, ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Pill tone="green" size={13}>{o.funding}</Pill>
      {o.match !== undefined ? (
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 18, color: c.brand700, opacity: showMatch }}>{Math.round(o.match * showMatch)}% match</span>
      ) : (
        <Bookmark size={20} color={saved ? c.brand600 : c.ink300} fill={saved ? c.brand600 : 'none'} />
      )}
    </div>
    <div style={{ fontFamily: display, fontWeight: 800, fontSize: 19, lineHeight: 1.25, color: c.ink900 }}>{o.title}</div>
    <div style={{ fontFamily: sans, fontSize: 15, color: c.ink600, marginTop: 4 }}>{o.org}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, fontFamily: sans, fontSize: 14, color: c.ink800 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={15} color={c.brand600} />{o.level}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={15} color={c.brand600} />{o.country}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: '1 / 3' }}><CalendarClock size={15} color={c.amber600} />Closes {o.deadline}</span>
    </div>
  </Panel>
)

/** Fictional sample listings used across the series. */
export const LISTINGS: Listing[] = [
  { title: 'MSc Public Health Scholarship', org: 'University of Edinburgh', country: 'United Kingdom', level: 'Masters', funding: 'Fully funded', deadline: '15 Jan', match: 94 },
  { title: 'Global Health Fellowship', org: 'Karolinska Institutet', country: 'Sweden', level: 'Masters', funding: 'Fully funded', deadline: '2 Feb', match: 88 },
  { title: 'Data Science PhD Studentship', org: 'TU Munich', country: 'Germany', level: 'PhD', funding: 'Stipend + fees', deadline: '28 Feb', match: 81 },
  { title: 'Graduate Research Award', org: 'University of Toronto', country: 'Canada', level: 'Masters', funding: 'Partial', deadline: '10 Mar', match: 76 },
  { title: 'Future Leaders Masters Award', org: 'University of Leeds', country: 'United Kingdom', level: 'Masters', funding: 'Fully funded', deadline: '20 Mar', match: 72 },
  { title: 'Climate Policy Scholarship', org: 'Wageningen University', country: 'Netherlands', level: 'Masters', funding: 'Fully funded', deadline: '1 Apr', match: 69 },
]

/** The dashboard's compact strip of circular stat icons. */
export const StatStrip: React.FC<{ items: { Icon: React.FC<{ size?: number; color?: string }>; value: number; label: string; tone: [string, string] }[]; from: number; width?: number }> = ({
  items, from, width = 1040,
}) => {
  const frame = useCurrentFrame()
  return (
    <Panel style={{ width, display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, padding: 0, borderRadius: 24 }}>
      {items.map(({ Icon, value, label, tone }, i) => {
        const p = interpolate(frame, [from + i * 6, from + i * 6 + 14], [0, 1], clamp)
        const n = Math.round(value * interpolate(frame, [from + i * 6, from + i * 6 + 30], [0, 1], clamp))
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderLeft: i ? `1.5px solid ${c.surface100}` : 'none', ...pop(p) }}>
            <span style={{ width: 52, height: 52, borderRadius: 99, background: tone[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={24} color={tone[1]} /></span>
            <span>
              <span style={{ display: 'block', fontFamily: display, fontWeight: 800, fontSize: 30, color: c.ink900, lineHeight: 1 }}>{n}</span>
              <span style={{ display: 'block', fontFamily: sans, fontWeight: 600, fontSize: 15, color: c.ink600, marginTop: 4 }}>{label}</span>
            </span>
          </div>
        )
      })}
    </Panel>
  )
}

/** Credit balance with drafts-left meter, as on the tool pages. */
export const CreditMeter: React.FC<{ credits: number; max?: number; width?: number; style?: React.CSSProperties }> = ({ credits, max = 100, width = 560, style }) => {
  const drafts = Math.floor(credits / 20)
  return (
    <Panel style={{ width, padding: '18px 22px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 16, ...style }}>
      <span style={{ width: 52, height: 52, borderRadius: 16, background: c.brand50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Coins size={26} color={c.brand700} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 19, color: c.ink800 }}>
          <b style={{ color: c.ink900 }}>{credits} credits</b> · {drafts} draft{drafts === 1 ? '' : 's'} left
        </div>
        <div style={{ marginTop: 10, height: 10, borderRadius: 99, background: c.surface100, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, (credits / Math.max(max, credits)) * 100)}%`, height: '100%', borderRadius: 99, background: c.brand600 }} />
        </div>
      </div>
    </Panel>
  )
}

/** Big checklist row that ticks itself at `at`. */
export const Tick: React.FC<{ label: string; at: number; size?: number; sub?: string }> = ({ label, at, size = 22, sub }) => {
  const frame = useCurrentFrame()
  const done = interpolate(frame, [at, at + 8], [0, 1], clamp)
  const show = useIn(at - 14)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', ...rise(show, 14) }}>
      <span style={{ width: size + 12, height: size + 12, borderRadius: 10, border: `2.5px solid ${done > 0.5 ? c.green600 : c.surface200}`, background: done > 0.5 ? c.green600 : c.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={size} color={c.white} strokeWidth={3} style={{ transform: `scale(${done})` }} />
      </span>
      <span>
        <span style={{ display: 'block', fontFamily: sans, fontWeight: 700, fontSize: size, color: c.ink900 }}>{label}</span>
        {sub && <span style={{ display: 'block', fontFamily: sans, fontSize: size * 0.72, color: c.ink600 }}>{sub}</span>}
      </span>
    </div>
  )
}

/** Opening title card: a kicker, a big line, and floating chips. */
export const TitleCard: React.FC<{ kicker: string; title: string; chips?: string[] }> = ({ kicker, title, chips = [] }) => {
  const frame = useCurrentFrame()
  const t = useIn(4)
  const spots: [number, number][] = [[40, 90], [880, 70], [10, 560], [900, 590], [470, 640], [520, 20]]
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {chips.map((chip, i) => {
        const p = interpolate(frame, [14 + i * 5, 30 + i * 5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) })
        const [x, y] = spots[i % spots.length]
        return (
          <div key={chip} style={{ position: 'absolute', left: x, top: y + Math.sin((frame + i * 25) / 18) * 8, ...pop(p), background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', color: c.white, borderRadius: 999, padding: '12px 22px', fontFamily: sans, fontWeight: 700, fontSize: 22 }}>
            {chip}
          </div>
        )
      })}
      <div style={{ position: 'absolute', left: 100, right: 100, top: 230, textAlign: 'center', ...rise(t, 30) }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 22, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.accent200 }}>{kicker}</div>
        <Heading size={68} color={c.white} style={{ marginTop: 16 }}>{title}</Heading>
      </div>
    </div>
  )
}

/** Closing call to action used by every video in the series. */
export const Outro: React.FC<{ line: string; perks?: string[] }> = ({ line, perks = ['Free account', '100 free AI credits', 'New scholarships every week'] }) => {
  const frame = useCurrentFrame()
  const logo = useIn(0)
  const head = useIn(10)
  const btn = useLand(40)
  const pulse = 1 + Math.sin(frame / 7) * 0.02 * btn
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
      <div style={pop(logo)}><Logo white height={80} /></div>
      <Heading size={58} color={c.white} style={{ textAlign: 'center', maxWidth: 1000, ...rise(head, 24) }}>{line}</Heading>
      <div style={{ display: 'flex', gap: 14 }}>
        {perks.map((p, i) => (
          <div key={p} style={{ ...pop(useLand(24 + i * 6)), display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: '12px 20px', fontFamily: sans, fontWeight: 700, fontSize: 20, color: c.white }}>
            <Check size={20} color={c.accent200} strokeWidth={3} /> {p}
          </div>
        ))}
      </div>
      <div style={{ transform: `scale(${(0.8 + 0.2 * btn) * pulse})`, opacity: btn, display: 'flex', alignItems: 'center', gap: 14, background: c.white, color: c.brand700, borderRadius: 999, padding: '20px 40px', fontFamily: display, fontWeight: 800, fontSize: 32 }}>
        <Globe size={30} /> thexcel360.com <ArrowRight size={30} />
      </div>
    </div>
  )
}

/** Gift box with "+50" bursting out, for referral moments. */
export const GiftBurst: React.FC<{ at: number; label: string; style?: React.CSSProperties }> = ({ at, label, style }) => {
  const p = useLand(at, 18)
  const glow = useProgress(at, at + 30)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, ...style }}>
      <div style={{ width: 120, height: 120, borderRadius: 32, background: c.green50, border: `2px solid ${c.green600}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${60 * glow}px rgba(5,150,105,${0.35 * glow})`, ...pop(p) }}>
        <Gift size={60} color={c.green700} />
      </div>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 40, color: c.green700, ...rise(p, 20) }}>+50</div>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 20, color: c.ink800, ...rise(p, 20) }}>{label}</div>
    </div>
  )
}
