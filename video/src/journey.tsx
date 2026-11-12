import React from 'react'
import { interpolate, useCurrentFrame, Easing } from 'remotion'
import {
  Bookmark, CalendarClock, Bell, SquareKanban, Check, Mail, PenLine, ScrollText, Send, Sparkles, GraduationCap,
  MapPin, Wallet, ArrowRight, Share2, Link2,
} from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Cursor, Heading, Logo, Panel, Pill, pop, rise, useCount, useIn, useProgress, useTyped } from './ui'
import type { Scene } from './Video'

/* ---------- shared pieces ---------- */

const OPPS = [
  { org: 'Rhodes Trust', title: 'Rhodes Scholarship', where: 'United Kingdom', match: 96, initials: 'RT' },
  { org: 'Chevening', title: 'Chevening Scholarship', where: 'United Kingdom', match: 92, initials: 'CH' },
  { org: 'DAAD', title: 'DAAD EPOS Scholarship', where: 'Germany', match: 88, initials: 'DA' },
]

const OppCard: React.FC<{ o: (typeof OPPS)[number]; style?: React.CSSProperties; saved?: number }> = ({ o, style, saved = 0 }) => (
  <Panel style={{ width: 360, padding: 24, borderRadius: 24, ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: c.brand600, color: c.white, fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{o.initials}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: c.ink500, fontWeight: 600 }}>{o.org}</div>
        <Pill tone="green" size={13}>{o.match}% match</Pill>
      </div>
    </div>
    <Heading size={24} style={{ marginTop: 16 }}>{o.title}</Heading>
    <div style={{ marginTop: 14, background: c.surface50, borderRadius: 16, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 15 }}>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: c.ink600 }}><MapPin size={16} color={c.ink400} />{o.where}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: c.ink600 }}><Wallet size={16} color={c.ink400} />Fully funded</span>
    </div>
    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: c.amber700 }}>21 days left</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: saved > 0.5 ? c.brand600 : c.white, border: `1.5px solid ${saved > 0.5 ? c.brand600 : c.surface200}`, transform: `scale(${1 + Math.sin(saved * Math.PI) * 0.25})` }}>
          <Bookmark size={20} color={saved > 0.5 ? c.white : c.ink400} fill={saved > 0.5 ? c.white : 'none'} />
        </div>
        <span style={{ background: c.brand600, color: c.white, fontWeight: 700, fontSize: 15, padding: '9px 16px', borderRadius: 12 }}>Details</span>
      </div>
    </div>
  </Panel>
)

/* ---------- 1. Hook: too much information ---------- */

const CHAOS = [
  ['Deadline: 15 Jan?', -420, -250, -6], ['IELTS 6.5 overall', 300, -270, 5], ['2 reference letters', -470, -40, 4],
  ['Certified transcript', 380, -60, -5], ['SOP · 750 words', -300, 170, -3], ['Portal password?', 420, 160, 6],
  ['Bank statement', -40, -300, 2], ['Which country?', 60, 250, -4], ['Full or partial funding?', -150, -150, 7],
  ['Email the professor', 170, 60, -7], ['Interview prep', -180, 60, 3], ['Personal statement', 120, -150, -2],
] as const

const ChaosCards: React.FC<{ collapse?: number }> = ({ collapse = 0 }) => {
  const frame = useCurrentFrame()
  return (
    <>
      {CHAOS.map(([label, x, y, r], i) => {
        const p = interpolate(frame, [i * 4, i * 4 + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6)) })
        const bob = Math.sin((frame + i * 13) / 14) * 6
        const k = 1 - collapse
        return (
          <div key={label} style={{
            position: 'absolute', left: 600 + x * k, top: 360 + y * k + bob * k,
            transform: `translate(-50%, -50%) rotate(${r * k}deg) scale(${p * (1 - collapse * 0.7)})`,
            opacity: Math.min(p, 1 - collapse),
            background: c.white, borderRadius: 18, padding: '14px 20px', fontFamily: sans, fontWeight: 700, fontSize: 21, color: c.ink800,
            boxShadow: '0 18px 40px -18px rgba(14,38,67,0.55)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: [c.red600, c.amber600, c.brand600, c.violet600][i % 4] }} />
            {label}
          </div>
        )
      })}
    </>
  )
}

const Hook: React.FC = () => <ChaosCards />

/* ---------- mini dashboard used in scene 2 ---------- */

const MiniDashboard: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: 'absolute', left: 140, top: 60, width: 920, height: 600, transform: `scale(${0.7 + 0.3 * p})`, opacity: p, display: 'flex', gap: 18, padding: 18, borderRadius: 34, background: c.surface100, boxShadow: '0 40px 80px -30px rgba(14,38,67,0.6)' }}>
    <Panel style={{ width: 200, padding: 18, borderRadius: 24 }}>
      <Logo height={26} />
      {['Dashboard', 'Pipeline', 'Tracker', 'Deadlines', 'Writing Tools'].map((l, i) => (
        <div key={l} style={{ marginTop: i === 0 ? 20 : 8, padding: '10px 12px', borderRadius: 12, fontSize: 15, fontWeight: 600, background: i === 0 ? c.brand600 : 'transparent', color: i === 0 ? c.white : c.ink600 }}>{l}</div>
      ))}
    </Panel>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ borderRadius: 24, padding: 24, color: c.white, background: `linear-gradient(135deg, ${c.brand600}, ${c.brand800})` }}>
        <Heading size={26} color={c.white}>12 scholarships match your profile</Heading>
        <div style={{ fontSize: 15, color: c.brand100, marginTop: 6 }}>Ranked by fit, then by deadline</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[[Bookmark, '3', c.brand600], [SquareKanban, '2', c.violet600], [CalendarClock, '1', c.amber600], [Bell, '4', c.green600]].map(([I, v, col], i) => {
          const Icon = I as typeof Bookmark
          return (
            <Panel key={i} style={{ padding: 16, borderRadius: 20 }}>
              <Icon size={22} color={col as string} />
              <Heading size={28} style={{ marginTop: 8 }}>{v as string}</Heading>
            </Panel>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        <Panel style={{ borderRadius: 20, padding: 16 }}><div style={{ height: 12, width: '60%', background: c.surface200, borderRadius: 9 }} /><div style={{ height: 12, width: '85%', background: c.surface100, borderRadius: 9, marginTop: 12 }} /></Panel>
        <Panel dark style={{ borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}><Sparkles size={20} color={c.accent200} /><span style={{ fontWeight: 700 }}>AI writing tools</span></Panel>
      </div>
    </div>
  </div>
)

const OnePlace: React.FC = () => {
  const collapse = useProgress(0, 24)
  const p = useIn(16)
  return (
    <>
      <ChaosCards collapse={collapse} />
      <MiniDashboard p={p} />
    </>
  )
}

/* ---------- 3. Profile ---------- */

const Profile: React.FC = () => {
  const level = useTyped('Masters', 14)
  const field = useTyped('Public Health', 36)
  const countries = ['United Kingdom', 'Canada', 'Germany']
  const frame = useCurrentFrame()
  const filled = (level.length === 7 ? 1 : 0) + (field.length === 13 ? 1 : 0) + countries.filter((_, i) => frame > 80 + i * 12).length
  const pct = Math.round(interpolate(filled, [0, 5], [20, 100]))
  const shownPct = Math.round(interpolate(frame, [0, 140], [20, pct], { extrapolateRight: 'clamp' }))
  const ringP = useIn(0)
  const doneP = useIn(150)
  const r = 92
  const circ = 2 * Math.PI * r
  const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.ink500 }}>{label}</div>
      <div style={{ marginTop: 8, minHeight: 56, borderRadius: 16, background: c.surface50, border: `1.5px solid ${c.surface200}`, padding: '12px 18px', fontSize: 22, fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
      <Panel style={{ width: 600, padding: 36, ...rise(useIn(0)) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 99, background: `linear-gradient(135deg, ${c.brand500}, ${c.brand700})`, color: c.white, fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
          <div><Heading size={28}>Ada Okafor</Heading><div style={{ color: c.ink500, fontSize: 16 }}>Your profile</div></div>
        </div>
        <Field label="Level of study"><GraduationCap size={22} color={c.brand600} />{level}</Field>
        <Field label="Field">{field}</Field>
        <Field label="Target countries">
          {countries.map((co, i) => {
            const p = interpolate(frame, [80 + i * 12, 92 + i * 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            return p > 0 ? <span key={co} style={{ ...pop(p), display: 'inline-block' }}><Pill tone="blue" size={17}>{co}</Pill></span> : null
          })}
        </Field>
      </Panel>
      <div style={{ ...pop(ringP), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r={r} fill="none" stroke={c.surface200} strokeWidth="18" />
            <circle cx="110" cy="110" r={r} fill="none" stroke={c.brand600} strokeWidth="18" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - shownPct / 100)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 800, fontSize: 52, color: c.ink900 }}>{shownPct}%</div>
        </div>
        <div style={{ ...pop(doneP) }}><Pill tone="green" size={20}>Profile complete</Pill></div>
      </div>
    </div>
  )
}

/* ---------- 4. Matches ---------- */

const Matches: React.FC = () => {
  const count = useCount(12, 6, 30)
  const banner = useIn(0)
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '10px 0' }}>
      <div style={{ ...rise(banner), borderRadius: 30, padding: '30px 36px', color: c.white, background: `linear-gradient(135deg, ${c.brand600}, ${c.brand800})`, boxShadow: '0 24px 50px -24px rgba(34,102,177,0.7)', display: 'flex', alignItems: 'center', gap: 26 }}>
        <div style={{ width: 84, height: 84, borderRadius: 99, border: '8px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={40} color={c.white} strokeWidth={3} /></div>
        <div>
          <Heading size={42} color={c.white}>{count} scholarships match your profile</Heading>
          <div style={{ fontSize: 20, color: c.brand100, marginTop: 6, fontFamily: sans }}>Ranked by your profile, then by deadline.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 30, marginTop: 34, justifyContent: 'center' }}>
        {OPPS.map((o, i) => <OppCard key={o.title} o={o} style={rise(useIn(18 + i * 8), 60)} />)}
      </div>
    </div>
  )
}

/* ---------- 5. Save ---------- */

const Save: React.FC = () => {
  const frame = useCurrentFrame()
  const click = 40
  const saved = interpolate(frame, [click, click + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fly = useProgress(click + 4, click + 28)
  const savedCount = frame > click + 26 ? 3 : 2
  const tick = useIn(click + 26, 12)
  const toast = useIn(click + 30)
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Panel style={{ position: 'absolute', right: 40, top: 10, width: 230, padding: 22, borderRadius: 24, ...rise(useIn(0)) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: c.brand50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bookmark size={24} color={c.brand600} /></div>
          <div>
            <Heading size={40} style={{ transform: `scale(${1 + (frame > click + 26 ? Math.sin(tick * Math.PI) * 0.3 : 0)})`, transformOrigin: 'left center' }}>{savedCount}</Heading>
            <div style={{ fontSize: 16, fontWeight: 600, color: c.ink500 }}>Saved</div>
          </div>
        </div>
      </Panel>
      <div style={{ position: 'absolute', left: 40, top: 150, display: 'flex', gap: 30 }}>
        {OPPS.map((o, i) => <OppCard key={o.title} o={o} saved={i === 0 ? saved : 0} />)}
      </div>
      {fly > 0 && fly < 1 && (
        <div style={{ position: 'absolute', left: interpolate(fly, [0, 1], [226, 1000]), top: interpolate(fly, [0, 1], [332, 60]) - Math.sin(fly * Math.PI) * 120, width: 60, height: 60, borderRadius: 18, background: c.brand600, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - fly * 0.5})`, boxShadow: '0 12px 24px -8px rgba(34,102,177,0.8)' }}>
          <Bookmark size={28} color={c.white} fill={c.white} />
        </div>
      )}
      <div style={{ position: 'absolute', left: '50%', bottom: 20, transform: `translateX(-50%) translateY(${(1 - toast) * 40}px)`, opacity: toast, background: c.ink900, color: c.white, borderRadius: 999, padding: '14px 26px', fontFamily: sans, fontWeight: 700, fontSize: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Check size={22} color={c.accent200} /> Saved to your pipeline
      </div>
      <Cursor path={[[0, 900, 700], [30, 252, 356], [click + 30, 252, 356]]} clicks={[click]} />
    </div>
  )
}

/* ---------- 6. Pipeline ---------- */

const STAGES = [
  { t: 'Saved', tone: 'slate' as const }, { t: 'Preparing', tone: 'amber' as const }, { t: 'Submitted', tone: 'blue' as const },
  { t: 'Interview', tone: 'violet' as const }, { t: 'Result', tone: 'green' as const },
]
const FILLER = [['Chevening Scholarship', 0], ['Erasmus Mundus', 1], ['Fulbright Program', 2], ['DAAD EPOS', 0], ['Commonwealth Masters', 3]] as const

const Pipeline: React.FC = () => {
  const frame = useCurrentFrame()
  const STEP = 34
  const START = 18
  const pos = interpolate(frame, [START, START + STEP * 4], [0, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // Ease within each hop so the card settles in a column before moving on.
  const hop = Math.floor(pos)
  const frac = pos - hop
  const eased = hop + Easing.inOut(Easing.cubic)(Math.min(1, frac * 1.6))
  const col = Math.round(eased)
  const COLW = 222
  const done = frame > START + STEP * 4
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 12, ...rise(useIn(0)) }}>
      {STAGES.map((st, i) => (
        <div key={st.t} style={{ width: COLW, height: 700, borderRadius: 26, background: 'rgba(255,255,255,0.65)', border: `1.5px solid ${c.surface200}`, padding: 14, fontFamily: sans }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transform: `scale(${col === i ? 1.06 : 1})`, transformOrigin: 'left center' }}>
            <Pill tone={st.tone} size={16}>{st.t}</Pill>
          </div>
          <div style={{ marginTop: 160 }}>
            {FILLER.filter((f) => f[1] === i).map(([name]) => (
              <Panel key={name} style={{ padding: 16, borderRadius: 18, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                <div style={{ height: 8, width: '70%', background: c.surface200, borderRadius: 9, marginTop: 10 }} />
              </Panel>
            ))}
          </div>
        </div>
      ))}
      <Panel style={{ position: 'absolute', left: 8 + eased * (COLW + 12), top: 64, width: COLW - 16, padding: 16, borderRadius: 18, border: `2px solid ${c.brand500}`, boxShadow: '0 30px 50px -20px rgba(34,102,177,0.55)', transform: `rotate(${Math.sin(frac * Math.PI) * 3}deg)` }}>
        <Pill tone="blue" size={12} dot={false}>Scholarship</Pill>
        <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8, fontFamily: display }}>Rhodes Scholarship</div>
        <div style={{ fontSize: 13, color: c.ink500 }}>Rhodes Trust</div>
        <div style={{ marginTop: 10, fontSize: 13, color: c.ink500, display: 'flex', justifyContent: 'space-between' }}><span>Documents</span><span>{Math.min(8, col * 3)}/8</span></div>
        <div style={{ height: 7, borderRadius: 9, background: c.surface100, marginTop: 4 }}><div style={{ height: 7, borderRadius: 9, background: c.brand500, width: `${Math.min(100, col * 37.5)}%` }} /></div>
        {done && <div style={{ marginTop: 10, ...pop(Math.min(1, (frame - START - STEP * 4) / 10)) }}><Pill tone="green" size={13}>Accepted</Pill></div>}
      </Panel>
    </div>
  )
}

/* ---------- 7. Reminders ---------- */

const Reminders: React.FC = () => {
  const frame = useCurrentFrame()
  const tile = useIn(0)
  const mail = useIn(20, 14)
  const ring = frame > 20 && frame < 60 ? Math.sin(frame * 1.1) * 18 * (1 - (frame - 20) / 40) : 0
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
      <div style={{ ...pop(tile), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 210, borderRadius: 34, overflow: 'hidden', background: c.white, boxShadow: '0 30px 60px -25px rgba(14,38,67,0.45)', textAlign: 'center' }}>
          <div style={{ background: c.red600, color: c.white, fontFamily: sans, fontWeight: 800, fontSize: 26, padding: 12, letterSpacing: '0.1em' }}>OCT</div>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 110, color: c.ink900, lineHeight: 1.2 }}>15</div>
        </div>
        <Pill tone="red" size={22}>7 days left</Pill>
      </div>
      <Panel style={{ width: 600, padding: 30, transform: `translateY(${(1 - mail) * -80}px)`, opacity: mail }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: c.brand600, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${ring}deg)` }}><Bell size={30} color={c.white} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, color: c.ink500, fontWeight: 600 }}>Xcel360 · to ada@email.com</div>
            <Heading size={26}>Rhodes Scholarship closes in 7 days</Heading>
          </div>
        </div>
        <div style={{ marginTop: 22, fontSize: 19, color: c.ink600, lineHeight: 1.5 }}>
          You saved this opportunity. You still have <b style={{ color: c.ink900 }}>3 of 8 documents</b> to prepare.
        </div>
        <div style={{ marginTop: 22, display: 'flex', gap: 12 }}>
          <span style={{ background: c.brand600, color: c.white, borderRadius: 999, padding: '12px 22px', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>Open checklist <ArrowRight size={18} /></span>
          <span style={{ border: `1.5px solid ${c.surface200}`, borderRadius: 999, padding: '12px 22px', fontWeight: 700, fontSize: 18, color: c.ink600 }}>View deadline</span>
        </div>
      </Panel>
    </div>
  )
}

/* ---------- 8. Tools teaser ---------- */

export const TOOLS = [
  { Icon: PenLine, label: 'CV Builder', hint: 'A scholarship-ready CV from your answers' },
  { Icon: ScrollText, label: 'SOP Generator', hint: 'A statement of purpose in your own words' },
  { Icon: Mail, label: 'Cover Letter', hint: 'Matched to each role or programme' },
  { Icon: Send, label: 'Cold Email', hint: 'Reach supervisors and professors' },
]

export const ToolsCard: React.FC<{ startAt?: number; width?: number }> = ({ startAt = 10, width = 640 }) => {
  const frame = useCurrentFrame()
  return (
    <Panel dark style={{ width, padding: 32, ...pop(useIn(0)) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={26} color={c.accent200} /></div>
        <div><Heading size={30} color={c.white}>AI writing tools</Heading><div style={{ color: c.ink300, fontSize: 17 }}>Drafts in minutes, in your own words</div></div>
      </div>
      <div style={{ marginTop: 20 }}>
        {TOOLS.map(({ Icon, label, hint }, i) => {
          const on = interpolate(frame, [startAt + i * 12, startAt + i * 12 + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 20, marginTop: 6, background: `rgba(255,255,255,${0.09 * on})`, opacity: 0.35 + 0.65 * on }}>
              <Icon size={26} color={c.accent200} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 21 }}>{label}</div><div style={{ color: c.ink300, fontSize: 16 }}>{hint}</div></div>
              <ArrowRight size={22} color={on > 0.5 ? c.white : c.ink400} />
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

const ToolsTeaser: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ToolsCard /></div>
)

/* ---------- Closing: share ---------- */

const SHARE = [['WhatsApp', '#25D366'], ['X', '#000000'], ['TikTok', '#111111'], ['YouTube', '#FF0000']] as const

export const ShareCta: React.FC = () => {
  const frame = useCurrentFrame()
  const card = useIn(0)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      <div style={{ ...pop(card), width: 150, height: 150, borderRadius: 44, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Share2 size={70} color={c.white} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {SHARE.map(([name, col], i) => {
          const p = interpolate(frame, [10 + i * 6, 22 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) })
          return (
            <span key={name} style={{ ...pop(p), display: 'inline-flex', alignItems: 'center', gap: 10, background: c.white, borderRadius: 999, padding: '14px 24px', fontFamily: sans, fontWeight: 700, fontSize: 24, color: c.ink900 }}>
              <span style={{ width: 14, height: 14, borderRadius: 99, background: col }} />{name}
            </span>
          )
        })}
      </div>
      <div style={{ ...rise(useIn(40)), display: 'inline-flex', alignItems: 'center', gap: 14, background: c.ink900, color: c.white, borderRadius: 999, padding: '18px 34px', fontFamily: display, fontWeight: 800, fontSize: 40 }}>
        <Link2 size={34} color={c.accent200} /> thexcel360.com
      </div>
    </div>
  )
}

/* ---------- script ---------- */

export const JOURNEY: Scene[] = [
  { id: 'hook', dark: true, dur: s(6.5), Visual: Hook, text: 'Scholarships can change your life. But keeping up with all the information can be exhausting.' },
  { id: 'one-place', dur: s(6), Visual: OnePlace, text: 'Xcel360 brings your whole scholarship journey into one place, with guidance at every step.' },
  { id: 'profile', dur: s(7), Visual: Profile, text: "Create your account and fill in your profile: your level, your field, and the countries you're aiming for." },
  { id: 'matches', dur: s(5.5), Visual: Matches, text: 'Your dashboard then shows the scholarships that match your profile.' },
  { id: 'save', dur: s(4.5), Visual: Save, text: 'Save the ones that interest you.' },
  { id: 'pipeline', dur: s(7), Visual: Pipeline, text: 'Then track each one from Saved to Preparing, Submitted, Interview, and Result.' },
  { id: 'reminders', dur: s(5.5), Visual: Reminders, text: 'Before a deadline closes, a reminder lands in your email.' },
  { id: 'tools', dur: s(6.5), Visual: ToolsTeaser, text: 'Need a CV, a statement of purpose, or a cold email? The tools are right there too.' },
  { id: 'share', dark: true, dur: s(7.5), Visual: ShareCta, text: 'Enjoying the benefits? Share Xcel360 with your friends and family, so they can explore these opportunities too.' },
]
