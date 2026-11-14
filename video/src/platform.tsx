/** Video 1 - "What you can do on Xcel360": the public website tour. */
import React from 'react'
import { interpolate } from 'remotion'
import { useCurrentFrame } from './time'
import { Bell, Bookmark, Briefcase, CalendarDays, CheckCircle2, FileText, Mail, Newspaper, Search, Share2, Users } from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Cursor, Heading, Panel, Pill, pop, rise, useIn, useTyped } from './ui'
import { Browser, HeroStrip, LISTINGS, ListingCard, Outro, TitleCard, clamp, useLand } from './kit'
import type { Scene } from './Video'

/* 1. Hook */
const Hook: React.FC = () => (
  <TitleCard kicker="Xcel360" title="Scholarships, jobs and mentorship in one place" chips={['Fully funded', 'Masters', 'PhD', 'Internships', 'Jobs', 'Mentorship']} />
)

/* 2. Search and filter */
const SearchScene: React.FC = () => {
  const frame = useCurrentFrame()
  const typed = useTyped('masters public health', 18, 22)
  const chips = ['Fully funded', 'Masters', 'United Kingdom']
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
      <Browser url="/opportunities" height={560} style={{ marginTop: 40, ...pop(useIn(0)) }}>
        <HeroStrip title="Find your scholarship" sub="Search by field, level, country and funding" height={140} />
        <div style={{ position: 'absolute', top: 108, left: 36, right: 36 }}>
          <Panel style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 18 }}>
            <Search size={24} color={c.ink500} />
            <span style={{ fontFamily: sans, fontSize: 22, color: c.ink900, flex: 1 }}>{typed}<span style={{ color: c.brand600, opacity: Math.floor(frame / 8) % 2 }}>|</span></span>
            <span style={{ background: c.brand600, color: c.white, borderRadius: 12, padding: '10px 20px', fontFamily: sans, fontWeight: 700, fontSize: 18 }}>Search</span>
          </Panel>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {chips.map((t, i) => <span key={t} style={pop(useLand(70 + i * 6))}><Pill tone="blue" size={16}>{t}</Pill></span>)}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 20 }}>
            {LISTINGS.slice(0, 3).map((o, i) => (
              <ListingCard key={o.title} o={{ ...o, match: undefined }} width={330} style={rise(useLand(95 + i * 8), 30)} />
            ))}
          </div>
        </div>
      </Browser>
    </div>
  )
}

/* 3. Opportunity details */
const Detail: React.FC = () => {
  const frame = useCurrentFrame()
  const save = 150
  const saved = frame >= save
  const rows: [string, string][] = [
    ['Who can apply', 'Graduates with a 2:1 or higher and 2 years of health-sector work'],
    ['Documents needed', 'CV, statement of purpose, 2 references, transcripts'],
    ['Funding', 'Tuition, living stipend and return flights'],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
      <Browser url="/opportunities/msc-public-health" height={520} style={{ marginTop: 60, ...pop(useIn(0)) }}>
        <HeroStrip title="MSc Public Health Scholarship" sub="University of Edinburgh · United Kingdom" height={130} />
        <div style={{ display: 'flex', gap: 22, padding: '22px 30px' }}>
          <div style={{ flex: 1 }}>
            {rows.map(([k, v], i) => (
              <Panel key={k} style={{ padding: '16px 20px', borderRadius: 16, marginBottom: 12, ...rise(useLand(20 + i * 14), 20) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: display, fontWeight: 800, fontSize: 19 }}><CheckCircle2 size={20} color={c.green600} />{k}</div>
                <div style={{ fontFamily: sans, fontSize: 17, color: c.ink800, marginTop: 6 }}>{v}</div>
              </Panel>
            ))}
          </div>
          <Panel style={{ width: 330, padding: 22, borderRadius: 18, ...rise(useLand(30), 20) }}>
            <div style={{ fontFamily: sans, fontSize: 15, color: c.ink600, fontWeight: 600 }}>Deadline</div>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 30, color: c.ink900 }}>15 January</div>
            <Pill tone="amber" size={15}>62 days left</Pill>
            <div style={{ marginTop: 18, background: c.brand600, color: c.white, borderRadius: 14, padding: '14px 0', textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 18 }}>Apply on official site</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, border: `1.5px solid ${saved ? c.brand600 : c.surface200}`, background: saved ? c.brand50 : c.white, color: c.brand700, borderRadius: 14, padding: '12px 0', textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 17, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', transform: `scale(${frame >= save && frame < save + 6 ? 0.94 : 1})` }}>
                <Bookmark size={18} fill={saved ? c.brand600 : 'none'} /> {saved ? 'Saved' : 'Save'}
              </div>
              <div style={{ flex: 1, border: `1.5px solid ${c.surface200}`, color: c.ink800, borderRadius: 14, padding: '12px 0', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', fontFamily: sans, fontWeight: 700, fontSize: 17 }}>
                <Share2 size={18} /> Share
              </div>
            </div>
          </Panel>
        </div>
      </Browser>
      <Cursor path={[[90, 1150, 700], [save - 6, 880, 470], [save + 40, 880, 470]]} clicks={[save]} />
    </div>
  )
}

/* 4. Everything else on the site */
const More: React.FC = () => {
  const tiles = [
    { Icon: Briefcase, label: 'Jobs & internships', sub: 'Roles for graduates and students', col: c.brand600, bg: c.brand50 },
    { Icon: CalendarDays, label: 'Events & webinars', sub: 'Info sessions and CV clinics', col: c.violet600, bg: c.violet50 },
    { Icon: Newspaper, label: 'News & guides', sub: 'How to apply, step by step', col: c.amber600, bg: c.amber50 },
    { Icon: FileText, label: 'Templates', sub: 'Sample CVs, SOPs and letters', col: c.green600, bg: c.green50 },
    { Icon: Users, label: 'Mentorship', sub: 'Cohorts and advisors', col: c.brand700, bg: c.accent100 },
    { Icon: Bell, label: 'Deadline alerts', sub: 'Never miss a closing date', col: c.red600, bg: c.red50 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 340px)', gap: 22, justifyContent: 'center', alignContent: 'center' }}>
      {tiles.map(({ Icon, label, sub, col, bg }, i) => (
        <Panel key={label} style={{ padding: 26, borderRadius: 24, ...pop(useLand(6 + i * 6)) }}>
          <span style={{ width: 60, height: 60, borderRadius: 18, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={30} color={col} /></span>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 24, marginTop: 16 }}>{label}</div>
          <div style={{ fontFamily: sans, fontSize: 17, color: c.ink600, marginTop: 4 }}>{sub}</div>
        </Panel>
      ))}
    </div>
  )
}

/* 5. Friday digest */
const Digest: React.FC = () => {
  const frame = useCurrentFrame()
  const fly = interpolate(frame, [10, 40], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
      <Panel style={{ width: 560, padding: 0, overflow: 'hidden', borderRadius: 22, transform: `translateY(${(1 - fly) * -120}px)`, opacity: fly }}>
        <div style={{ background: 'linear-gradient(160deg, #163b67, #2266b1)', padding: '22px 28px', color: c.white }}>
          <div style={{ fontFamily: sans, fontSize: 15, letterSpacing: '0.16em', fontWeight: 800, color: c.accent200 }}>THE FRIDAY DIGEST</div>
          <Heading size={28} color={c.white} style={{ marginTop: 6 }}>5 new scholarships for you</Heading>
        </div>
        <div style={{ padding: '10px 28px 20px' }}>
          {LISTINGS.slice(0, 4).map((o, i) => (
            <div key={o.title} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1.5px solid ${c.surface100}`, fontFamily: sans, fontSize: 18, ...rise(useLand(40 + i * 8), 12) }}>
              <span style={{ fontWeight: 700, color: c.ink900 }}>{o.title}</span><span style={{ color: c.ink600 }}>{o.deadline}</span>
            </div>
          ))}
        </div>
      </Panel>
      <div style={{ ...pop(useLand(70)), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 120, height: 120, borderRadius: 36, background: c.brand600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={60} color={c.white} /></span>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 26, color: c.ink900 }}>Every Friday</span>
      </div>
    </div>
  )
}

/* 6. Free account unlocks the dashboard */
const Account: React.FC = () => {
  const items = ['Scholarships matched to your profile', 'A pipeline to track every application', 'AI tools for your CV, SOP and letters', '100 free AI credits to start']
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <Panel style={{ width: 460, padding: 34, borderRadius: 26, ...pop(useIn(0)) }}>
        <Heading size={32}>Create your free account</Heading>
        {['Full name', 'Email', 'Password'].map((f, i) => (
          <div key={f} style={{ marginTop: 16, ...rise(useLand(8 + i * 6), 14) }}>
            <div style={{ fontFamily: sans, fontSize: 15, color: c.ink600, fontWeight: 600 }}>{f}</div>
            <div style={{ height: 46, borderRadius: 12, border: `1.5px solid ${c.surface200}`, marginTop: 6 }} />
          </div>
        ))}
        <div style={{ marginTop: 22, background: c.brand600, color: c.white, borderRadius: 14, padding: '15px 0', textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 19 }}>Sign up free</div>
      </Panel>
      <div style={{ width: 520 }}>
        {items.map((t, i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, ...rise(useLand(40 + i * 12), 20) }}>
            <CheckCircle2 size={32} color={c.green600} />
            <span style={{ fontFamily: display, fontWeight: 800, fontSize: 27, color: c.ink900 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const End: React.FC = () => <Outro line="Start your search today" />

export const PLATFORM: Scene[] = [
  { id: 'hook', dark: true, dur: 100, Visual: Hook, text: 'Xcel360 brings scholarships, jobs and mentorship together in one place.' },
  { id: 'search', dur: 165, Visual: SearchScene, text: 'Search by field, level, country and funding, and see what is open right now.' },
  { id: 'detail', dur: 190, Visual: Detail, text: 'Every listing shows who can apply, the documents you need and the deadline. Save it or share it in one tap.' },
  { id: 'more', dur: 110, Visual: More, text: 'There is more: jobs, internships, events, guides, templates and mentorship.' },
  { id: 'digest', dur: 130, Visual: Digest, text: 'Join the Friday digest and new scholarships come straight to your inbox.' },
  { id: 'account', dur: 140, Visual: Account, text: 'Create a free account to unlock your dashboard, your tracker and the AI writing tools.' },
  { id: 'end', dark: true, dur: 110, Visual: End, text: 'Start your search today at thexcel360.com.' },
]
