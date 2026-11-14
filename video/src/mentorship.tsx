/** Video 4 - "Membership and mentorship": free membership, cohorts, advisors, events, certificates, community. */
import React from 'react'
import { interpolate } from 'remotion'
import { useCurrentFrame } from './time'
import { Award, BadgeCheck, CalendarDays, Check, ClipboardCheck, Headset, MessageCircle, Mic, QrCode, UserPlus, Users, CirclePlay } from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Heading, Panel, Pill, pop, rise, useIn } from './ui'
import { Outro, TitleCard, clamp, useLand } from './kit'
import type { Scene } from './Video'

const Hook: React.FC = () => (
  <TitleCard kicker="Xcel360 community" title="You don't have to do this alone" chips={['Mentorship cohorts', 'Advisors', 'Webinars', 'Certificates', 'WhatsApp channel']} />
)

/* 2. Membership */
const Member: React.FC = () => {
  const frame = useCurrentFrame()
  const flip = interpolate(frame, [30, 50], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
      <Panel style={{ width: 460, padding: 0, overflow: 'hidden', borderRadius: 28, ...pop(useIn(0)) }}>
        <div style={{ background: 'linear-gradient(160deg, #163b67, #2266b1)', padding: 28, color: c.white, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 76, height: 76, borderRadius: 22, background: c.white, color: c.brand700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 800, fontSize: 32 }}>AO</span>
          <div>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 28 }}>Ada Okafor</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(255,255,255,0.16)', borderRadius: 99, padding: '6px 12px', fontFamily: sans, fontWeight: 700, fontSize: 15, opacity: flip }}>
              <BadgeCheck size={16} color={c.accent200} /> Xcel360 member
            </div>
          </div>
        </div>
        <div style={{ padding: '18px 28px 26px' }}>
          {['Free to join', 'Matched scholarships', 'Access to events and cohorts', '100 free AI credits'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', fontFamily: sans, fontWeight: 700, fontSize: 20, color: c.ink900, ...rise(useLand(40 + i * 8), 14) }}>
              <Check size={22} color={c.green600} strokeWidth={3} />{t}
            </div>
          ))}
        </div>
      </Panel>
      <div style={{ ...pop(useLand(20)), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 130, height: 130, borderRadius: 40, background: c.brand600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={64} color={c.white} /></span>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 28 }}>Sign up in a minute</span>
      </div>
    </div>
  )
}

/* 3. Mentorship cohorts */
const Cohorts: React.FC = () => {
  const frame = useCurrentFrame()
  const cohorts = [['Cohort 1', 100], ['Cohort 2', 50], ['Cohort 3', 60]] as const
  const total = cohorts.reduce((a, [, n]) => a + n, 0)
  const shown = Math.round(total * interpolate(frame, [70, 110], [0, 1], clamp))
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {cohorts.map(([name, n], i) => {
          const p = useLand(6 + i * 10)
          const count = Math.round(n * interpolate(frame, [16 + i * 10, 56 + i * 10], [0, 1], clamp))
          return (
            <Panel key={name} style={{ width: 300, padding: 28, borderRadius: 26, textAlign: 'center', ...pop(p) }}>
              <Pill tone="blue" size={16}>{name}</Pill>
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: 72, color: c.brand600, lineHeight: 1.1, marginTop: 14 }}>{count}</div>
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 19, color: c.ink700 }}>students mentored</div>
            </Panel>
          )
        })}
      </div>
      <Panel style={{ padding: '18px 30px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 16, ...rise(useLand(70), 20) }}>
        <Users size={30} color={c.brand700} />
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 26 }}>{shown}+ students across three cohorts</span>
      </Panel>
      <div style={{ fontFamily: sans, fontSize: 20, color: c.ink700, ...rise(useLand(90), 14) }}>Multi-week programs that take you from shortlist to submitted application</div>
    </div>
  )
}

/* 4. Advisors */
const Advisors: React.FC = () => {
  const items = [
    { Icon: Headset, title: 'Strategy call', text: '30 minutes to shortlist scholarships and plan your timeline' },
    { Icon: ClipboardCheck, title: 'Application review', text: 'Your SOP, CV and essays checked against the criteria' },
    { Icon: Mic, title: 'Interview preparation', text: 'A mock interview with honest feedback' },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <Heading size={40} style={rise(useIn(0), 16)}>Speak with an advisor</Heading>
      <div style={{ display: 'flex', gap: 22 }}>
        {items.map(({ Icon, title, text }, i) => (
          <Panel key={title} style={{ width: 340, padding: 28, borderRadius: 26, ...pop(useLand(10 + i * 10)) }}>
            <span style={{ width: 62, height: 62, borderRadius: 20, background: c.brand50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={30} color={c.brand700} /></span>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 25, marginTop: 16 }}>{title}</div>
            <div style={{ fontFamily: sans, fontSize: 18, color: c.ink700, marginTop: 6, lineHeight: 1.4 }}>{text}</div>
          </Panel>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, ...rise(useLand(50), 14) }}>
        {['A real person replies within 2 working days', 'Your documents stay private'].map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c.green50, color: c.green700, borderRadius: 999, padding: '10px 18px', fontFamily: sans, fontWeight: 700, fontSize: 18 }}><Check size={18} strokeWidth={3} />{t}</span>
        ))}
      </div>
    </div>
  )
}

/* 5. Events -> certificate */
const Events: React.FC = () => {
  const frame = useCurrentFrame()
  const REG = 40
  const registered = frame >= REG
  const cert = useLand(80, 20)
  const verified = interpolate(frame, [130, 145], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <Panel style={{ width: 430, padding: 28, borderRadius: 26, ...pop(useIn(0)) }}>
        <Pill tone="violet" size={15}>Live webinar</Pill>
        <Heading size={28} style={{ marginTop: 12 }}>CV clinic: scholarship-ready CVs</Heading>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans, fontSize: 18, color: c.ink700, marginTop: 10 }}><CalendarDays size={18} />Saturday · 4:00 PM WAT</div>
        <div style={{ marginTop: 20, borderRadius: 14, padding: '14px 0', textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 19, background: registered ? c.green600 : c.brand600, color: c.white, transform: `scale(${frame >= REG && frame < REG + 6 ? 0.94 : 1})` }}>
          {registered ? 'Registered: check your email' : 'Register free'}
        </div>
      </Panel>
      <Panel style={{ width: 540, padding: 34, borderRadius: 14, border: `3px solid ${c.brand200}`, textAlign: 'center', position: 'relative', ...pop(cert) }}>
        <Award size={44} color={c.amber600} />
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 15, letterSpacing: '0.2em', color: c.brand600, marginTop: 8 }}>CERTIFICATE OF PARTICIPATION</div>
        <div style={{ fontFamily: display, fontWeight: 800, fontSize: 34, marginTop: 12 }}>Ada Okafor</div>
        <div style={{ fontFamily: sans, fontSize: 17, color: c.ink700, marginTop: 6 }}>CV clinic: scholarship-ready CVs</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 20 }}>
          <QrCode size={56} color={c.ink900} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.green50, color: c.green700, borderRadius: 999, padding: '8px 14px', fontFamily: sans, fontWeight: 800, fontSize: 16, opacity: verified, transform: `scale(${0.8 + 0.2 * verified})` }}>
            <BadgeCheck size={18} /> Verified
          </span>
        </div>
      </Panel>
    </div>
  )
}

/* 6. Community */
const Community: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
    {[
      { Icon: MessageCircle, title: 'WhatsApp channel', text: 'New openings and live updates', bg: '#e8f8ee', col: '#128c4b' },
      { Icon: CirclePlay, title: 'YouTube', text: 'Webinar replays and how-to guides', bg: c.red50, col: c.red600 },
      { Icon: UserPlus, title: 'Become a mentor', text: 'Won a scholarship? Help the next person', bg: c.brand50, col: c.brand700 },
    ].map(({ Icon, title, text, bg, col }, i) => (
      <Panel key={title} style={{ width: 340, padding: 30, borderRadius: 26, textAlign: 'center', ...pop(useLand(6 + i * 10)) }}>
        <span style={{ margin: '0 auto', width: 80, height: 80, borderRadius: 26, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={40} color={col} /></span>
        <div style={{ fontFamily: display, fontWeight: 800, fontSize: 26, marginTop: 18 }}>{title}</div>
        <div style={{ fontFamily: sans, fontSize: 18, color: c.ink700, marginTop: 6 }}>{text}</div>
      </Panel>
    ))}
  </div>
)

const End: React.FC = () => <Outro line="Join the Xcel360 community" perks={['Free membership', 'Mentorship cohorts', 'Advisor support']} />

export const MENTORSHIP: Scene[] = [
  { id: 'hook', dark: true, dur: 100, Visual: Hook, text: "Applying abroad is hard. With Xcel360, you don't have to do it alone." },
  { id: 'member', dur: 120, Visual: Member, text: 'Membership is free. Sign up and you get matched scholarships, events, cohorts and 100 AI credits.' },
  { id: 'cohorts', dur: 150, Visual: Cohorts, text: 'Our mentorship cohorts have guided more than 200 students, from shortlist to submitted application.' },
  { id: 'advisors', dur: 110, Visual: Advisors, text: 'Need one-to-one help? Book a strategy call, an application review or interview practice with an advisor.' },
  { id: 'events', dur: 175, Visual: Events, text: 'Join free webinars and CV clinics, and get a certificate anyone can verify.' },
  { id: 'community', dur: 95, Visual: Community, text: 'Follow us on WhatsApp and YouTube, and once you win, come back as a mentor.' },
  { id: 'end', dark: true, dur: 110, Visual: End, text: 'Join free at thexcel360.com.' },
]
