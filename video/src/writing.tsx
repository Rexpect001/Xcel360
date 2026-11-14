/** Video 5 - "The AI writing tools": CV tracks, SOP/letters/emails, drafts + Trash, Launchpad. */
import React from 'react'
import { interpolate, Easing } from 'remotion'
import { useCurrentFrame } from './time'
import { CalendarRange, Clock, FileText, Lightbulb, Mail, MessageCircleQuestion, PenLine, RotateCcw, ScrollText, Send, Sparkles, Trash2 } from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Cursor, Heading, Line, Panel, Pill, pop, rise, useIn } from './ui'
import { Outro, TitleCard, clamp, useLand } from './kit'
import type { Scene } from './Video'

const Hook: React.FC = () => (
  <TitleCard kicker="AI writing tools" title="Your CV, SOP and letters, drafted from your own story" chips={['Academic CV', 'Job CV', 'SOP', 'Cover letter', 'Cold email', 'Launchpad']} />
)

/* 2. Academic vs Job CV toggle */
const ACADEMIC = ['EDUCATION', 'RESEARCH EXPERIENCE', 'PUBLICATIONS', 'TEACHING', 'AWARDS', 'REFEREES']
const JOB = ['PROFESSIONAL SUMMARY', 'EXPERIENCE', 'KEY PROJECTS', 'EDUCATION', 'SKILLS', 'CERTIFICATIONS']

const CvTracks: React.FC = () => {
  const frame = useCurrentFrame()
  const SWITCH = 110
  const job = frame >= SWITCH
  const knob = interpolate(frame, [SWITCH, SWITCH + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const local = job ? frame - SWITCH : frame
  const sections = job ? JOB : ACADEMIC
  const questions = job
    ? ['What do you bring to this kind of role?', 'Key projects or achievements', 'Relevant work and internships']
    : ['Which research interests fit this programme?', 'Your thesis or strongest project', 'Publications and presentations']
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 36 }}>
      <div style={{ width: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...rise(useIn(0), 16) }}><PenLine size={28} color={c.brand600} /><Heading size={30}>CV Builder</Heading></div>
        <div style={{ marginTop: 18, fontFamily: sans, fontWeight: 700, fontSize: 18, color: c.ink800 }}>Which CV do you need?</div>
        <div style={{ position: 'relative', marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', background: c.surface100, borderRadius: 16, padding: 6, ...rise(useLand(6), 14) }}>
          <div style={{ position: 'absolute', top: 6, bottom: 6, left: 6, width: 'calc(50% - 6px)', borderRadius: 12, background: c.white, boxShadow: '0 4px 12px -6px rgba(19,28,43,0.3)', transform: `translateX(${knob * 100}%)` }} />
          {['Academic CV', 'Job / Industry CV'].map((t, i) => (
            <div key={t} style={{ position: 'relative', textAlign: 'center', padding: '14px 0', fontFamily: sans, fontWeight: 800, fontSize: 19, color: (i === 1) === job ? c.brand700 : c.ink600 }}>{t}</div>
          ))}
        </div>
        <div style={{ marginTop: 6, fontFamily: sans, fontSize: 16, color: c.ink700 }}>{job ? 'For employers, internships and graduate schemes' : 'For scholarships, admissions and fellowships'}</div>
        <div style={{ marginTop: 16 }}>
          {questions.map((q, i) => (
            <Panel key={q} style={{ padding: '16px 18px', borderRadius: 16, marginBottom: 12, opacity: interpolate(local, [8 + i * 8, 20 + i * 8], [0, 1], clamp), transform: `translateY(${interpolate(local, [8 + i * 8, 20 + i * 8], [16, 0], clamp)}px)` }}>
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 18 }}>{q}</div>
              <div style={{ marginTop: 10, height: 34, borderRadius: 10, background: c.surface50, border: `1.5px solid ${c.surface200}` }} />
            </Panel>
          ))}
        </div>
      </div>
      <Panel style={{ width: 500, height: 700, padding: 36, borderRadius: 16, ...pop(useIn(4)) }}>
        <div style={{ textAlign: 'center' }}><Heading size={30}>Ada Okafor</Heading><div style={{ fontFamily: sans, fontSize: 15, color: c.ink600, marginTop: 4 }}>ada@email.com · Lagos</div></div>
        {sections.map((sec, i) => (
          <div key={sec} style={{ marginTop: 18, opacity: interpolate(local, [14 + i * 7, 26 + i * 7], [0, 1], clamp) }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', color: c.brand700, borderBottom: `2px solid ${c.brand100}`, paddingBottom: 6, marginBottom: 10 }}>{sec}</div>
            <Line w={400} h={10} /><Line w={320} h={10} />
          </div>
        ))}
      </Panel>
      <Cursor path={[[60, 1100, 700], [SWITCH - 6, 400, 160], [SWITCH + 40, 400, 160]]} clicks={[SWITCH]} />
    </div>
  )
}

/* 3. The other writing tools */
const Tools: React.FC = () => {
  const frame = useCurrentFrame()
  const cards = [
    { Icon: ScrollText, name: 'SOP Generator', line: 'A statement of purpose that follows one clear thread', col: c.violet600, bg: c.violet50 },
    { Icon: Mail, name: 'Cover Letter', line: 'Each requirement matched to your real evidence', col: c.amber600, bg: c.amber50 },
    { Icon: Send, name: 'Cold Email', line: 'Short, respectful emails to potential supervisors', col: c.green600, bg: c.green50 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      {cards.map(({ Icon, name, line, col, bg }, i) => {
        const p = useLand(6 + i * 12)
        const fill = interpolate(frame, [30 + i * 12, 90 + i * 12], [0, 1], clamp)
        return (
          <Panel key={name} style={{ width: 350, height: 520, padding: 28, borderRadius: 26, ...pop(p) }}>
            <span style={{ width: 64, height: 64, borderRadius: 20, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={32} color={col} /></span>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 27, marginTop: 18 }}>{name}</div>
            <div style={{ fontFamily: sans, fontSize: 18, color: c.ink700, marginTop: 6, lineHeight: 1.4 }}>{line}</div>
            <div style={{ marginTop: 22 }}>
              {[290, 280, 250, 290, 200].map((w, k) => <Line key={k} w={w} p={Math.min(1, Math.max(0, fill * 5 - k))} h={10} />)}
            </div>
            <div style={{ marginTop: 14 }}><Pill tone="slate" size={14}>20 credits per draft</Pill></div>
          </Panel>
        )
      })}
    </div>
  )
}

/* 4. Drafts and Trash */
const Drafts: React.FC = () => {
  const frame = useCurrentFrame()
  const DEL = 70
  const RESTORE = 140
  const inTrash = frame >= DEL + 8 && frame < RESTORE + 8
  const tab = inTrash ? 'Trash' : 'Active'
  const rows = [
    ['CV Builder', 'MSc Public Health Scholarship', 'Moves to Trash in 24 days'],
    ['SOP Generator', 'Global Health Fellowship', 'Moves to Trash in 27 days'],
  ]
  const lands = [useLand(10), useLand(18)]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Panel style={{ width: 900, padding: 32, borderRadius: 26, ...pop(useIn(0)) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Heading size={32}>My drafts</Heading>
          <div style={{ display: 'flex', background: c.surface100, borderRadius: 14, padding: 5 }}>
            {['Active', 'Trash'].map((t) => (
              <span key={t} style={{ padding: '10px 20px', borderRadius: 10, fontFamily: sans, fontWeight: 800, fontSize: 17, background: tab === t ? c.white : 'transparent', color: tab === t ? c.ink900 : c.ink600 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: sans, fontSize: 17, color: c.ink700, marginTop: 6 }}>Kept for 30 days, then 30 more in Trash so you can restore them.</div>
        <div style={{ marginTop: 18 }}>
          {rows.map(([tool, title, note], i) => {
            const isFirst = i === 0
            // In the Trash tab only the deleted draft (the first row) is listed. The row is
            // hidden rather than skipped so every frame calls the same hooks.
            const visible = isFirst || !inTrash
            return (
              <div key={title} style={{ display: visible ? 'flex' : 'none', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: `1.5px solid ${c.surface100}`, ...rise(lands[i], 14) }}>
                <FileText size={26} color={c.brand600} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 15, color: c.brand700 }}>{tool}</div>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 21 }}>{title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, fontSize: 15, color: c.ink700, marginTop: 2 }}>
                    <Clock size={14} /> {isFirst && inTrash ? 'Deleted for good in 30 days' : note}
                  </div>
                </div>
                {isFirst && inTrash && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: c.brand700, fontFamily: sans, fontWeight: 800, fontSize: 17, padding: '10px 14px', borderRadius: 12, background: frame >= RESTORE && frame < RESTORE + 6 ? c.brand100 : c.brand50 }}><RotateCcw size={18} /> Restore</span>
                )}
                <Trash2 size={22} color={isFirst && frame >= DEL && frame < DEL + 6 ? c.red600 : c.ink400} />
              </div>
            )
          })}
        </div>
      </Panel>
      <Cursor path={[[30, 1150, 700], [DEL - 6, 1012, 300], [DEL + 30, 1012, 300], [RESTORE - 6, 905, 300], [RESTORE + 30, 905, 300]]} clicks={[DEL, RESTORE]} />
    </div>
  )
}

/* 5. Launchpad */
const Launchpad: React.FC = () => {
  const frame = useCurrentFrame()
  const steps = [
    { Icon: Lightbulb, title: 'Shape the idea', text: 'Who it is for and what to test first' },
    { Icon: MessageCircleQuestion, title: 'Customer interviews', text: 'Questions that get honest answers' },
    { Icon: CalendarRange, title: 'First-month plan', text: 'A practical roadmap, week by week' },
  ]
  const line = interpolate(frame, [30, 100], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...rise(useIn(0), 16) }}><Sparkles size={30} color={c.brand600} /><Heading size={38}>Xcel360 Launchpad</Heading><Pill tone="blue" size={15}>New</Pill></div>
      <div style={{ position: 'relative', display: 'flex', gap: 40 }}>
        <div style={{ position: 'absolute', top: 60, left: 170, height: 4, width: 760 * line, background: c.brand200, borderRadius: 99 }} />
        {steps.map(({ Icon, title, text }, i) => (
          <Panel key={title} style={{ position: 'relative', width: 320, padding: 26, borderRadius: 26, textAlign: 'center', ...pop(useLand(16 + i * 14)) }}>
            <span style={{ margin: '0 auto', width: 70, height: 70, borderRadius: 99, background: c.brand600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={32} color={c.white} /></span>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 14, letterSpacing: '0.16em', color: c.brand600, marginTop: 14 }}>STEP {i + 1}</div>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 25, marginTop: 4 }}>{title}</div>
            <div style={{ fontFamily: sans, fontSize: 18, color: c.ink700, marginTop: 6 }}>{text}</div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

const End: React.FC = () => <Outro line="Write with confidence" perks={['Academic and job CVs', 'Drafts kept 30 days', '100 free credits']} />

export const WRITING: Scene[] = [
  { id: 'hook', dark: true, dur: 100, Visual: Hook, text: 'Meet the Xcel360 writing tools, built around your own story.' },
  { id: 'cv', dur: 205, Visual: CvTracks, text: 'Start with the CV Builder. Choose an academic CV for scholarships, or a job CV for employers, and the questions change to match.' },
  { id: 'tools', dur: 145, Visual: Tools, text: 'Then draft your statement of purpose, cover letters and emails to supervisors.' },
  { id: 'drafts', dur: 185, Visual: Drafts, text: 'Every draft is saved for 30 days. Delete one by mistake? It waits in Trash for 30 more, ready to restore.' },
  { id: 'launchpad', dur: 135, Visual: Launchpad, text: 'Building something of your own? Launchpad helps you test an idea and plan your first month.' },
  { id: 'end', dark: true, dur: 110, Visual: End, text: 'Start writing free at thexcel360.com.' },
]
