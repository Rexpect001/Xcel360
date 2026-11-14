/** Video 2 - "How the AI helps you apply": matching, tailoring, checks, credits, invites. */
import React from 'react'
import { interpolate } from 'remotion'
import { useCurrentFrame } from './time'
import { AlertTriangle, ArrowRight, Check, Info, Mail, PenLine, ScrollText, Sparkles, Target, Wand2 } from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Cursor, Heading, Panel, Pill, pop, rise, useIn, useProgress } from './ui'
import { CreditMeter, GiftBurst, LISTINGS, ListingCard, Outro, TitleCard, clamp, useLand } from './kit'
import type { Scene } from './Video'

const Hook: React.FC = () => (
  <TitleCard kicker="New on Xcel360" title="AI that starts from what the scholarship asks for" chips={['Matched to you', 'Tailored drafts', 'Quality checks', '100 free credits']} />
)

/* 2. Profile -> match scores */
const Matching: React.FC = () => {
  const frame = useCurrentFrame()
  const fill = useProgress(30, 70)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
      <Panel style={{ width: 360, padding: 28, borderRadius: 24, ...pop(useIn(0)) }}>
        <Heading size={26}>Your profile</Heading>
        {[['Level', 'Masters'], ['Field', 'Public Health'], ['Countries', 'UK, Sweden'], ['Degree', 'BSc Microbiology']].map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1.5px solid ${c.surface100}`, fontFamily: sans, fontSize: 18, ...rise(useLand(6 + i * 6), 12) }}>
            <span style={{ color: c.ink600 }}>{k}</span><b style={{ color: c.ink900 }}>{v}</b>
          </div>
        ))}
        <div style={{ marginTop: 16, fontFamily: sans, fontSize: 16, color: c.ink700 }}>Profile strength</div>
        <div style={{ marginTop: 8, height: 10, borderRadius: 99, background: c.surface100 }}><div style={{ width: `${40 + 60 * fill}%`, height: '100%', borderRadius: 99, background: c.brand600 }} /></div>
      </Panel>
      <ArrowRight size={44} color={c.brand600} style={{ opacity: interpolate(frame, [40, 55], [0, 1], clamp) }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {LISTINGS.slice(0, 4).map((o, i) => (
          <ListingCard key={o.title} o={o} width={300} showMatch={useProgress(60 + i * 8, 90 + i * 8)} style={rise(useLand(50 + i * 8), 24)} />
        ))}
      </div>
    </div>
  )
}

/* 3. Tailor to a listing */
const Tailor: React.FC = () => {
  const frame = useCurrentFrame()
  const CLICK = 70
  const open = frame > CLICK + 6
  const fields = [
    ['Which scholarship is this CV for?', 'MSc Public Health Scholarship (University of Edinburgh)'],
    ['What does the selection committee ask for?', '2:1 degree · 2 years of health-sector work · commitment to return home'],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      <Panel style={{ width: 430, padding: 28, borderRadius: 24, ...pop(useIn(0)) }}>
        <Pill tone="green" size={14}>Fully funded</Pill>
        <Heading size={26} style={{ marginTop: 12 }}>MSc Public Health Scholarship</Heading>
        <div style={{ fontFamily: sans, fontSize: 17, color: c.ink600, marginTop: 4 }}>University of Edinburgh</div>
        <div style={{ marginTop: 22, padding: 18, borderRadius: 18, background: c.brand50, border: `1.5px solid ${c.brand100}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: display, fontWeight: 800, fontSize: 19 }}><Target size={20} color={c.brand700} /> Tailor your application</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {[[PenLine, 'CV'], [ScrollText, 'SOP'], [Mail, 'Cover letter']].map(([Icon, l], i) => {
              const I = Icon as typeof PenLine
              const hot = i === 0 && frame >= CLICK && frame < CLICK + 6
              return <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6, background: i === 0 ? c.brand600 : c.white, color: i === 0 ? c.white : c.brand700, border: `1.5px solid ${c.brand200}`, borderRadius: 12, padding: '10px 14px', fontFamily: sans, fontWeight: 700, fontSize: 16, transform: `scale(${hot ? 0.92 : 1})` }}><I size={16} />{l as string}</span>
            })}
          </div>
        </div>
      </Panel>
      <div style={{ width: 560, opacity: open ? 1 : 0.25 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}><PenLine size={24} color={c.brand600} /><Heading size={26}>CV Builder</Heading><Pill tone="blue" size={14}>Tailored to this listing</Pill></div>
        {fields.map(([q, a], i) => {
          const p = useLand(CLICK + 14 + i * 14)
          return (
            <Panel key={q} style={{ padding: 20, borderRadius: 18, marginBottom: 14, ...rise(p, 20) }}>
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 18 }}>{q}</div>
              <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 12, background: interpolate(frame, [CLICK + 30 + i * 14, CLICK + 50 + i * 14], [0, 1], clamp) > 0.5 ? c.accent100 : c.surface50, border: `1.5px solid ${c.accent200}`, fontFamily: sans, fontSize: 17, color: c.ink800 }}>{a}</div>
            </Panel>
          )
        })}
        <div style={{ fontFamily: sans, fontSize: 17, color: c.ink700, ...rise(useLand(CLICK + 50), 12) }}>The listing fills in what it asks for. Your experience still comes from you.</div>
      </div>
      <Cursor path={[[20, 1100, 700], [CLICK - 6, 140, 470], [CLICK + 40, 140, 470]]} clicks={[CLICK]} />
    </div>
  )
}

/* 4. Quality checks + free fix */
const Checks: React.FC = () => {
  const frame = useCurrentFrame()
  const FIX = 120
  const fixed = frame >= FIX + 10
  const issues: [typeof AlertTriangle, string, string][] = [
    [AlertTriangle, 'A number you did not give us: "improved results by 40%"', c.amber600],
    [Info, 'Cliché: "I am passionate about"', c.brand600],
    [Info, 'Use years only on a CV: "March 2022"', c.brand600],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      <Panel style={{ width: 500, height: 430, padding: 36, borderRadius: 18, ...pop(useIn(0)) }}>
        <Heading size={26}>Your CV draft</Heading>
        <div style={{ marginTop: 18, fontFamily: sans, fontSize: 17, lineHeight: 1.7, color: c.ink800 }}>
          <div style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 14, color: c.brand700 }}>RESEARCH EXPERIENCE</div>
          • Cleaned outbreak data for three states{' '}
          <span style={{ background: fixed ? 'transparent' : c.amber50, textDecoration: fixed ? 'none' : `underline wavy ${c.amber600}` }}>{fixed ? '' : 'and improved results by 40%'}</span>
          <br />• Built weekly case dashboards for field teams
          <div style={{ marginTop: 14, fontWeight: 800, letterSpacing: '0.12em', fontSize: 14, color: c.brand700 }}>EDUCATION</div>
          BSc Microbiology, University of Ibadan, {fixed ? '2019-2023' : <span style={{ background: c.brand50, textDecoration: `underline wavy ${c.brand500}` }}>March 2019 - 2023</span>}
          <div style={{ marginTop: 14, color: c.ink600 }}>GPA: <span style={{ background: c.accent100, borderRadius: 6, padding: '0 6px', color: c.brand700, fontWeight: 700 }}>[add GPA]</span></div>
        </div>
      </Panel>
      <div style={{ width: 520 }}>
        <Heading size={26} style={rise(useIn(10), 14)}>{fixed ? 'All checks passed' : 'We check every draft'}</Heading>
        <div style={{ marginTop: 14 }}>
          {issues.map(([Icon, t, col], i) => (
            <Panel key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', borderRadius: 16, marginBottom: 12, ...rise(useLand(24 + i * 12), 16) }}>
              {fixed ? <Check size={24} color={c.green600} strokeWidth={3} /> : <Icon size={24} color={col} />}
              <span style={{ fontFamily: sans, fontSize: 18, color: fixed ? c.ink500 : c.ink900, textDecoration: fixed ? 'line-through' : 'none' }}>{t}</span>
            </Panel>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 10, background: fixed ? c.green600 : c.brand600, color: c.white, borderRadius: 999, padding: '15px 26px', fontFamily: sans, fontWeight: 700, fontSize: 19, transform: `scale(${frame >= FIX && frame < FIX + 6 ? 0.93 : 1})`, ...rise(useLand(70), 14) }}>
          {fixed ? <Check size={20} /> : <Wand2 size={20} />} {fixed ? 'Fixed, free of charge' : 'Fix these issues (free)'}
        </div>
      </div>
      <Cursor path={[[80, 1150, 720], [FIX - 6, 760, 545], [FIX + 40, 760, 545]]} clicks={[FIX]} />
    </div>
  )
}

/* 5. Credits */
const Credits: React.FC = () => {
  const frame = useCurrentFrame()
  const credits = Math.round(interpolate(frame, [70, 95], [100, 80], clamp))
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <div style={{ display: 'flex', gap: 22 }}>
        {[['100', 'free credits on sign-up'], ['20', 'credits per new draft'], ['5', 'free drafts to start']].map(([n, l], i) => (
          <Panel key={l} style={{ width: 300, padding: 26, borderRadius: 24, textAlign: 'center', ...pop(useLand(4 + i * 8)) }}>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 64, color: c.brand600, lineHeight: 1 }}>{n}</div>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 19, color: c.ink800, marginTop: 8 }}>{l}</div>
          </Panel>
        ))}
      </div>
      <CreditMeter credits={credits} width={700} style={rise(useLand(40), 20)} />
      <div style={{ display: 'flex', gap: 12, ...rise(useLand(60), 14) }}>
        {['Editing is free', 'Fixing issues is free', 'Failed drafts are refunded'].map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c.green50, color: c.green700, borderRadius: 999, padding: '10px 18px', fontFamily: sans, fontWeight: 700, fontSize: 18 }}><Check size={18} strokeWidth={3} />{t}</span>
        ))}
      </div>
    </div>
  )
}

/* 6. Invite a friend */
const Invite: React.FC = () => {
  const frame = useCurrentFrame()
  const link = 'thexcel360.com/signup?ref=ADA7K2QM'
  const typedN = Math.floor(interpolate(frame, [10, 40], [0, link.length], clamp))
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      <Panel style={{ width: 760, padding: '22px 26px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 14, ...pop(useIn(0)) }}>
        <Sparkles size={26} color={c.green600} />
        <span style={{ flex: 1, fontFamily: sans, fontSize: 22, color: c.ink900, fontWeight: 600 }}>{link.slice(0, typedN)}</span>
        <span style={{ background: c.brand600, color: c.white, borderRadius: 12, padding: '10px 18px', fontFamily: sans, fontWeight: 700, fontSize: 18 }}>Share</span>
      </Panel>
      <div style={{ display: 'flex', gap: 120, alignItems: 'center' }}>
        <GiftBurst at={50} label="for you" />
        <Heading size={34} color={c.ink800} style={{ opacity: interpolate(frame, [55, 70], [0, 1], clamp) }}>+</Heading>
        <GiftBurst at={62} label="for your friend" />
      </div>
    </div>
  )
}

const End: React.FC = () => <Outro line="Let AI do the heavy lifting" perks={['100 free credits', 'Tailored to each listing', 'Nothing made up']} />

export const SMART_AI: Scene[] = [
  { id: 'hook', dark: true, dur: 100, Visual: Hook, text: 'Our AI starts from what each scholarship actually asks for.' },
  { id: 'match', dur: 150, Visual: Matching, text: 'Fill in your profile, and we rank open scholarships by how well they fit you.' },
  { id: 'tailor', dur: 165, Visual: Tailor, text: 'Found one you like? Tailor your CV, SOP or cover letter to it in one click. The requirements fill in for you.' },
  { id: 'checks', dur: 175, Visual: Checks, text: 'Every draft is checked. We flag made-up numbers, clichés and formatting slips, and fixing them is free.' },
  { id: 'credits', dur: 135, Visual: Credits, text: 'You start with 100 free credits. Each new draft uses 20, so your first five drafts are on us.' },
  { id: 'invite', dur: 125, Visual: Invite, text: 'Share your invite link. When a friend joins, you both get 50 extra credits.' },
  { id: 'end', dark: true, dur: 110, Visual: End, text: 'Try it free at thexcel360.com.' },
]
