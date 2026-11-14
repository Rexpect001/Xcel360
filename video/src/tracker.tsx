/** Video 3 - "Your dashboard and pipeline": matches, save, pipeline stages, checklist, deadlines. */
import React from 'react'
import { interpolate, Easing } from 'remotion'
import { useCurrentFrame } from './time'
import { Bell, Bookmark, CalendarClock, Mail, PenLine, ScrollText, SquareKanban, Sparkles } from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Cursor, Heading, Panel, Pill, pop, rise, useIn } from './ui'
import { LISTINGS, ListingCard, Outro, StatStrip, Tick, TitleCard, clamp, useLand } from './kit'
import type { Scene } from './Video'

const Hook: React.FC = () => (
  <TitleCard kicker="Your dashboard" title="Every application, one clear plan" chips={['12 matches', 'Pipeline', 'Checklists', 'Deadline alerts']} />
)

/* 2. Dashboard overview: stat strip, 12 matches, sticky tools */
const Overview: React.FC = () => {
  const frame = useCurrentFrame()
  const scroll = interpolate(frame, [90, 170], [0, -220], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 30, top: 0, ...rise(useIn(0), 20) }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 15, letterSpacing: '0.16em', color: c.brand600 }}>GOOD MORNING</div>
        <Heading size={36}>Welcome back, Ada</Heading>
      </div>
      <div style={{ position: 'absolute', left: 30, top: 74 }}>
        <StatStrip
          from={12}
          width={1140}
          items={[
            { Icon: Bookmark, value: 6, label: 'Saved', tone: [c.brand50, c.brand700] },
            { Icon: SquareKanban, value: 3, label: 'In tracker', tone: [c.violet50, c.violet600] },
            { Icon: CalendarClock, value: 2, label: 'Closing in 30 days', tone: [c.amber50, c.amber700] },
            { Icon: Bell, value: 4, label: 'Unread alerts', tone: [c.green50, c.green700] },
          ]}
        />
      </div>
      <div style={{ position: 'absolute', left: 30, top: 186, display: 'flex', alignItems: 'baseline', gap: 14, ...rise(useLand(40), 14) }}>
        <Heading size={26}>Matched for you</Heading><span style={{ fontFamily: sans, fontSize: 17, color: c.ink600 }}>Your top 12, ranked by fit</span>
      </div>
      <div style={{ position: 'absolute', left: 30, top: 232, width: 760, height: 528, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, transform: `translateY(${scroll}px)` }}>
          {[...LISTINGS, ...LISTINGS].slice(0, 8).map((o, i) => (
            <ListingCard key={i} o={o} width={372} style={rise(useLand(46 + i * 5), 24)} />
          ))}
        </div>
      </div>
      <Panel dark style={{ position: 'absolute', left: 820, top: 186, width: 350, padding: 22, borderRadius: 24, ...rise(useLand(56), 24) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Sparkles size={22} color={c.accent200} /><span style={{ fontFamily: display, fontWeight: 800, fontSize: 21 }}>AI writing tools</span></div>
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', fontFamily: sans, fontSize: 16 }}><b>100 credits</b> · 5 drafts left</div>
        {[[PenLine, 'CV Builder'], [ScrollText, 'SOP Generator'], [Mail, 'Cover Letter']].map(([I, l]) => {
          const Icon = I as typeof PenLine
          return <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', fontFamily: sans, fontWeight: 700, fontSize: 18 }}><Icon size={18} color={c.accent200} />{l as string}</div>
        })}
        <div style={{ marginTop: 6, fontFamily: sans, fontSize: 14, color: c.accent200 }}>Stays in view while you scroll</div>
      </Panel>
    </div>
  )
}

/* 3. Save -> pipeline */
const STAGES = [
  { id: 'Saved', tone: 'slate' as const },
  { id: 'Preparing', tone: 'amber' as const },
  { id: 'Submitted', tone: 'blue' as const },
  { id: 'Interview', tone: 'violet' as const },
  { id: 'Result', tone: 'green' as const },
]

const Pipeline: React.FC = () => {
  const frame = useCurrentFrame()
  // The highlighted card walks across the board
  const stops = [40, 85, 130, 175]
  const step = stops.filter((f) => frame >= f).length
  const move = stops.map((f) => interpolate(frame, [f, f + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })).reduce((a, b) => a + b, 0)
  const colW = 222
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Heading size={30} style={{ position: 'absolute', left: 20, top: 0, ...rise(useIn(0), 14) }}>Opportunity pipeline</Heading>
      <div style={{ position: 'absolute', left: 20, top: 64, display: 'flex', gap: 14 }}>
        {STAGES.map((st, i) => (
          <Panel key={st.id} style={{ width: colW - 14, height: 600, padding: 14, borderRadius: 20, background: c.surface50, ...rise(useLand(4 + i * 5), 20) }}>
            <Pill tone={st.tone} size={15}>{st.id}</Pill>
            {i === 0 && <MiniCard title="Climate Policy Scholarship" top={58} />}
            {i === 1 && <MiniCard title="Data Science PhD" top={58} />}
            {i === 2 && <MiniCard title="Graduate Research Award" top={58} />}
          </Panel>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 64 + 160, left: 20 + 14 + move * colW, width: colW - 42, transform: `rotate(${Math.sin(move * Math.PI) * 3}deg)`, ...pop(useLand(10)) }}>
        <Panel style={{ padding: 14, borderRadius: 16, border: `2px solid ${c.brand600}` }}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 17, lineHeight: 1.25 }}>MSc Public Health Scholarship</div>
          <div style={{ fontFamily: sans, fontSize: 14, color: c.ink600, marginTop: 4 }}>Closes 15 Jan</div>
          <div style={{ marginTop: 10, height: 8, borderRadius: 99, background: c.surface100 }}><div style={{ width: `${Math.min(100, step * 25)}%`, height: '100%', borderRadius: 99, background: c.green600 }} /></div>
          <div style={{ fontFamily: sans, fontSize: 13, color: c.ink600, marginTop: 6 }}>{['Decide to apply', 'Gathering documents', 'Waiting to hear back', 'Interview booked', 'Accepted!'][step]}</div>
        </Panel>
      </div>
    </div>
  )
}

const MiniCard: React.FC<{ title: string; top: number }> = ({ title, top }) => (
  <div style={{ position: 'absolute', left: 14, right: 14, top, background: c.white, borderRadius: 14, border: `1.5px solid ${c.surface200}`, padding: 12, fontFamily: display, fontWeight: 800, fontSize: 15, color: c.ink800 }}>{title}</div>
)

/* 4. Document checklist */
const Checklist: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
    <Panel style={{ width: 600, padding: 34, borderRadius: 26, ...pop(useIn(0)) }}>
      <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: c.brand600 }}>MSc Public Health Scholarship</div>
      <Heading size={30}>Documents checklist</Heading>
      <div style={{ marginTop: 10 }}>
        <Tick label="CV" sub="Drafted with the CV Builder" at={30} />
        <Tick label="Statement of purpose" sub="750 words" at={55} />
        <Tick label="Two references" sub="Both referees confirmed" at={80} />
        <Tick label="Transcripts" sub="Requested from registry" at={105} />
      </div>
    </Panel>
    <div style={{ ...pop(useLand(120)), textAlign: 'center' }}>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 90, color: c.green600, lineHeight: 1 }}>4/4</div>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 22, color: c.ink800 }}>Ready to submit</div>
    </div>
  </div>
)

/* 5. Deadlines under Notifications */
const Deadlines: React.FC = () => {
  const frame = useCurrentFrame()
  const items = [
    ['MSc Public Health Scholarship', '7 days left', 'red'],
    ['Global Health Fellowship', '14 days left', 'amber'],
    ['Data Science PhD Studentship', '30 days left', 'slate'],
  ] as const
  const ping = interpolate(frame, [70, 90], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
      <Panel style={{ width: 300, padding: 20, borderRadius: 24, ...pop(useIn(0)) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: c.brand600, color: c.white, fontFamily: sans, fontWeight: 700, fontSize: 18 }}><Bell size={20} />Notifications</div>
        {['All notifications', 'Deadlines'].map((t, i) => (
          <div key={t} style={{ marginLeft: 22, padding: '12px 14px', borderLeft: `2px solid ${c.surface200}`, fontFamily: sans, fontWeight: i ? 800 : 600, fontSize: 17, color: i ? c.brand700 : c.ink700, background: i ? c.brand50 : 'transparent', borderRadius: '0 10px 10px 0', marginTop: 4 }}>{t}</div>
        ))}
      </Panel>
      <div style={{ width: 620 }}>
        <Heading size={30} style={rise(useIn(6), 14)}>Coming up</Heading>
        {items.map(([t, d, tone], i) => (
          <Panel key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 18, marginTop: 14, ...rise(useLand(16 + i * 10), 18) }}>
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 20 }}>{t}</span><Pill tone={tone} size={15}>{d}</Pill>
          </Panel>
        ))}
        <Panel style={{ marginTop: 22, padding: '16px 20px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14, border: `2px solid ${c.amber600}`, transform: `translateX(${(1 - ping) * 60}px)`, opacity: ping }}>
          <Mail size={26} color={c.amber600} />
          <span style={{ fontFamily: sans, fontSize: 18, color: c.ink900 }}><b>Reminder:</b> MSc Public Health closes in 7 days</span>
        </Panel>
        <div style={{ marginTop: 12, fontFamily: sans, fontSize: 17, color: c.ink700, opacity: ping }}>Reminders at 30, 14, 7 and 2 days, in the app and by email</div>
      </div>
    </div>
  )
}

const End: React.FC = () => <Outro line="Stay organised. Never miss a deadline." perks={['Your top 12 matches', 'Pipeline board', 'Deadline reminders']} />

export const TRACKER: Scene[] = [
  { id: 'hook', dark: true, dur: 100, Visual: Hook, text: 'Your Xcel360 dashboard turns a pile of tabs into one clear plan.' },
  { id: 'overview', dur: 200, Visual: Overview, text: 'See your saved items and next deadlines at a glance, with your top 12 matched scholarships right below.' },
  { id: 'pipeline', dur: 220, Visual: Pipeline, text: 'Save a scholarship and it joins your pipeline. Move it from Saved to Preparing, Submitted, Interview and Result.' },
  { id: 'checklist', dur: 165, Visual: Checklist, text: 'Each one gets a document checklist, so you know exactly what is still missing.' },
  { id: 'deadlines', dur: 140, Visual: Deadlines, text: 'Deadlines live under Notifications, with reminders 30, 14, 7 and 2 days before they close.' },
  { id: 'end', dark: true, dur: 110, Visual: End, text: 'Get organised for free at thexcel360.com.' },
]
