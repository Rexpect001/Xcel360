import React from 'react'
import { interpolate, useCurrentFrame, Easing } from 'remotion'
import { Sparkles, Check, Send, Mail, PenLine, ScrollText } from 'lucide-react'
import { c, display, s, sans } from './theme'
import { Cursor, Heading, Line, Logo, Panel, Pill, pop, rise, useCount, useIn, useProgress, useTyped } from './ui'
import { ShareCta } from './journey'
import type { Scene } from './Video'

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

/** A tool question with its answer typed in, as on the real form. */
const Question: React.FC<{ q: string; a: string; at: number; section?: string; width?: number }> = ({ q, a, at, section, width = 520 }) => {
  const p = useIn(at)
  const typed = useTyped(a, at + 10, 40)
  const frame = useCurrentFrame()
  const caret = typed.length < a.length && frame > at + 10 && Math.floor(frame / 8) % 2 === 0
  if (frame < at) return null
  return (
    <Panel style={{ width, padding: 22, borderRadius: 22, marginBottom: 14, ...rise(p, 30) }}>
      {section && <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: c.brand600, textTransform: 'uppercase', marginBottom: 6 }}>{section}</div>}
      <div style={{ fontSize: 18, fontWeight: 700, color: c.ink900, lineHeight: 1.35 }}>{q}</div>
      <div style={{ marginTop: 10, borderRadius: 14, background: c.surface50, border: `1.5px solid ${c.surface200}`, padding: '12px 14px', fontSize: 17, color: c.ink600, minHeight: 48, lineHeight: 1.4 }}>
        {typed}{caret && <span style={{ color: c.brand600 }}>|</span>}
      </div>
    </Panel>
  )
}

const GenerateButton: React.FC<{ label: string; pressAt: number; style?: React.CSSProperties }> = ({ label, pressAt, style }) => {
  const frame = useCurrentFrame()
  const pressed = frame >= pressAt && frame < pressAt + 8
  const working = frame >= pressAt + 8
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: working ? c.ink900 : c.brand600, color: c.white, borderRadius: 999, padding: '15px 26px', fontFamily: sans, fontWeight: 700, fontSize: 19, transform: `scale(${pressed ? 0.94 : 1})`, boxShadow: '0 14px 30px -12px rgba(34,102,177,0.7)', ...style }}>
      <Sparkles size={20} color={c.accent200} /> {working ? 'Drafting…' : label}
    </div>
  )
}

/* ---------- 1. Hook: the blank page ---------- */

const Hook: React.FC = () => {
  const frame = useCurrentFrame()
  const qs: [string, number, number][] = [
    ['Where do I start my CV?', 90, 120], ['What goes into an SOP?', 820, 90], ['Who do I email, and how?', 60, 560], ['Does my cover letter fit the role?', 760, 600],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Panel style={{ position: 'absolute', left: 390, top: 60, width: 420, height: 560, padding: 40, ...pop(useIn(0)) }}>
        <div style={{ width: 4, height: 34, background: c.brand600, opacity: Math.floor(frame / 12) % 2 === 0 ? 1 : 0 }} />
        <div style={{ position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 15, color: c.ink300, fontWeight: 600 }}>Untitled document · 0 words</div>
      </Panel>
      {qs.map(([q, x, y], i) => {
        const p = interpolate(frame, [20 + i * 14, 34 + i * 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) })
        return (
          <div key={q} style={{ position: 'absolute', left: x, top: y + Math.sin((frame + i * 20) / 16) * 6, ...pop(p), background: c.ink900, color: c.white, borderRadius: 18, padding: '14px 20px', fontFamily: sans, fontWeight: 700, fontSize: 21, boxShadow: '0 20px 40px -18px rgba(14,38,67,0.6)' }}>
            {q}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- 2. CV Builder ---------- */

const CvDoc: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const at = (k: number) => interpolate(frame, [from + k * 14, from + k * 14 + 16], [0, 1], clamp)
  const Sec: React.FC<{ title: string; k: number; children: React.ReactNode }> = ({ title, k, children }) => (
    <div style={{ marginTop: 20, ...rise(at(k), 16) }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: c.brand700, borderBottom: `2px solid ${c.brand100}`, paddingBottom: 6, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
  return (
    <Panel style={{ width: 560, height: 700, padding: 40, borderRadius: 18, fontFamily: sans, ...pop(useIn(from - 10)) }}>
      <div style={{ textAlign: 'center', ...rise(at(0), 16) }}>
        <Heading size={34}>Ada Okafor</Heading>
        <div style={{ fontSize: 14, color: c.ink500, marginTop: 6 }}>ada@email.com · Lagos, Nigeria · linkedin.com/in/ada</div>
      </div>
      <Sec title="EDUCATION" k={1}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}><span>BSc Microbiology, University of Ibadan</span><span style={{ color: c.ink500 }}>2019–2023</span></div>
        <div style={{ fontSize: 14, color: c.ink600, marginTop: 4 }}>Second Class Upper · 4.21/5.00</div>
      </Sec>
      <Sec title="RESEARCH EXPERIENCE" k={2}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Research Intern, NCDC Lagos</div>
        <div style={{ fontSize: 14, color: c.ink600, marginTop: 4, lineHeight: 1.45 }}>• Cleaned and analysed outbreak data for three states</div>
        <div style={{ fontSize: 14, color: c.ink600, lineHeight: 1.45 }}>• Built weekly case dashboards used by field teams</div>
      </Sec>
      <Sec title="LEADERSHIP" k={3}><Line w={420} /><Line w={340} /></Sec>
      <Sec title="SKILLS" k={4}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['R', 'Stata', 'Epi Info', 'Data cleaning', 'Report writing'].map((t) => <Pill key={t} tone="slate" size={13} dot={false}>{t}</Pill>)}</div>
      </Sec>
    </Panel>
  )
}

const CvBuilder: React.FC = () => {
  const PRESS = 165
  const frame = useCurrentFrame()
  const showDoc = frame > PRESS + 10
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 40, alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: 540, paddingTop: 10 }}>
        <div style={{ ...rise(useIn(0)), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <PenLine size={26} color={c.brand600} /><Heading size={28}>Academic CV Builder</Heading>
        </div>
        <Question at={6} section="Goal and contact" q="Which scholarship or programme is this CV for?" a="MSc Public Health scholarship, epidemiology focus" />
        <Question at={55} section="Academic foundation" q="For each degree: qualification, university, dates and grade" a="BSc Microbiology, University of Ibadan, 2019–2023, Second Class Upper" />
        <Question at={110} section="Experience and impact" q="Relevant work, internships and service" a="Research intern, NCDC Lagos: cleaned outbreak data for 3 states" />
        <div style={{ ...rise(useIn(140)) }}><GenerateButton label="Generate my CV" pressAt={PRESS} /></div>
      </div>
      {showDoc ? <CvDoc from={PRESS + 18} /> : <div style={{ width: 560 }} />}
      <Cursor path={[[120, 1100, 700], [PRESS - 8, 150, 650], [PRESS + 30, 150, 650]]} clicks={[PRESS]} />
    </div>
  )
}

/* ---------- 3. SOP ---------- */

const Sop: React.FC = () => {
  const frame = useCurrentFrame()
  const words = useCount(742, 70, 150)
  const para = (k: number) => interpolate(frame, [70 + k * 28, 100 + k * 28], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 40, justifyContent: 'center' }}>
      <div style={{ width: 500, paddingTop: 10 }}>
        <div style={{ ...rise(useIn(0)), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <ScrollText size={26} color={c.violet600} /><Heading size={28}>SOP Generator</Heading>
        </div>
        <Question width={500} at={4} q="Programme and university" a="MSc Global Health Policy, University of Edinburgh" />
        <Question width={500} at={36} q="The moment or problem that drives you" a="Watching a cholera outbreak overwhelm my hometown clinic" />
        <div style={{ ...rise(useIn(64)), display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: sans, fontWeight: 700, color: c.ink500, fontSize: 17, marginRight: 4 }}>Word limit</span>
          {['500', '750', '1000'].map((w) => <Pill key={w} tone={w === '750' ? 'blue' : 'slate'} size={16} dot={w === '750'}>{w}</Pill>)}
        </div>
      </div>
      <Panel style={{ width: 560, height: 680, padding: 40, borderRadius: 18, ...pop(useIn(60)) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading size={26}>Statement of Purpose</Heading>
          <Pill tone={words > 700 ? 'green' : 'slate'} size={14}>{words} / 750 words</Pill>
        </div>
        <div style={{ marginTop: 24, fontSize: 17, lineHeight: 1.6, color: c.ink800, ...rise(para(0), 12) }}>
          The week cholera reached my hometown, I watched our only clinic run out of beds by noon…
        </div>
        {[1, 2, 3, 4].map((k) => (
          <div key={k} style={{ marginTop: 22, ...rise(para(k), 12) }}>
            <Line w={480} /><Line w={470} /><Line w={490} /><Line w={300} />
          </div>
        ))}
      </Panel>
    </div>
  )
}

/* ---------- 4. Cover letter ---------- */

const CoverLetter: React.FC = () => {
  const greet = useTyped('Dear Dr. Amina Bello,', 20, 30)
  const frame = useCurrentFrame()
  const body = (k: number) => interpolate(frame, [50 + k * 10, 70 + k * 10], [0, 1], clamp)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 34, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...rise(useIn(0)) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Mail size={26} color={c.amber600} /><Heading size={28}>Cover Letter Builder</Heading></div>
        <Panel style={{ padding: 20, borderRadius: 20, width: 380 }}>
          <div style={{ fontSize: 15, color: c.ink500, fontWeight: 600 }}>Role or programme</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>Research Intern, WHO Africa Regional Office</div>
        </Panel>
        <div style={{ display: 'flex', gap: 10 }}><span style={{ fontFamily: sans, fontWeight: 700, color: c.ink500, fontSize: 17 }}>Tone</span><Pill tone="amber" size={16}>Warm and professional</Pill></div>
      </div>
      <Panel style={{ width: 560, height: 600, padding: 44, borderRadius: 18, ...pop(useIn(10)) }}>
        <div style={{ fontSize: 15, color: c.ink500 }}>Lagos · 6 October 2026</div>
        <div style={{ marginTop: 26, fontSize: 21, fontWeight: 700, minHeight: 30 }}>{greet}</div>
        {[0, 1, 2].map((k) => <div key={k} style={{ marginTop: 22, ...rise(body(k), 10) }}><Line w={470} /><Line w={460} /><Line w={420} /><Line w={250} /></div>)}
        <div style={{ marginTop: 18, fontSize: 18, color: c.ink800, ...rise(body(3), 10) }}>Yours sincerely,<br /><b>Ada Okafor</b></div>
      </Panel>
    </div>
  )
}

/* ---------- 5. Cold email ---------- */

const ColdEmail: React.FC = () => {
  const SEND = 120
  const frame = useCurrentFrame()
  const body = useTyped('Dear Professor Mensah, I read your 2024 paper on cassava drought resistance and would value the chance to discuss PhD supervision…', 40, 55)
  const sent = interpolate(frame, [SEND + 6, SEND + 20], [0, 1], clamp)
  const flyOut = useProgress(SEND + 4, SEND + 24)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Panel style={{ width: 760, padding: 0, overflow: 'hidden', ...pop(useIn(0)), transform: `translateX(${flyOut * 60}px) scale(${1 - flyOut * 0.04})` }}>
        <div style={{ background: c.surface50, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1.5px solid ${c.surface200}` }}>
          <Send size={22} color={c.green600} /><Heading size={22}>Cold Email Generator</Heading>
          <span style={{ marginLeft: 'auto' }}><Pill tone="green" size={15}>PhD supervision</Pill></span>
        </div>
        <div style={{ padding: '6px 28px', fontFamily: sans }}>
          {[['To', 'Prof. Kofi Mensah, Wageningen University'], ['Subject', 'Prospective PhD student: drought-resistant cassava']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 18, padding: '14px 0', borderBottom: `1.5px solid ${c.surface100}`, fontSize: 19 }}>
              <span style={{ width: 80, color: c.ink500 }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <div style={{ padding: '18px 0', fontSize: 19, lineHeight: 1.55, color: c.ink800, minHeight: 130 }}>{body}</div>
        </div>
        <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          {sent > 0
            ? <span style={{ ...pop(sent), display: 'inline-flex', alignItems: 'center', gap: 10, background: c.green600, color: c.white, borderRadius: 999, padding: '14px 26px', fontWeight: 700, fontSize: 19 }}><Check size={20} /> Ready to send</span>
            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: c.brand600, color: c.white, borderRadius: 999, padding: '14px 26px', fontWeight: 700, fontSize: 19, transform: `scale(${frame >= SEND && frame < SEND + 6 ? 0.94 : 1})` }}><Send size={18} /> Copy email</span>}
        </div>
      </Panel>
      <Cursor path={[[60, 1150, 720], [SEND - 6, 866, 512], [SEND + 40, 866, 512]]} clicks={[SEND]} />
    </div>
  )
}

/* ---------- 6. Structure in place ---------- */

const Structure: React.FC = () => {
  const frame = useCurrentFrame()
  const tiles = [
    { Icon: PenLine, label: 'CV Builder', col: c.brand600, bg: c.brand50 },
    { Icon: ScrollText, label: 'SOP Generator', col: c.violet600, bg: c.violet50 },
    { Icon: Mail, label: 'Cover Letter', col: c.amber600, bg: c.amber50 },
    { Icon: Send, label: 'Cold Email', col: c.green600, bg: c.green50 },
  ]
  const from = [[-500, -300], [500, -300], [-500, 300], [500, 300]]
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Panel style={{ padding: 30, borderRadius: 36, background: 'rgba(255,255,255,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22, ...pop(useIn(30)) }}><Logo height={40} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {tiles.map(({ Icon, label, col, bg }, i) => {
            const p = interpolate(frame, [i * 6, i * 6 + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
            const done = interpolate(frame, [40 + i * 8, 50 + i * 8], [0, 1], clamp)
            return (
              <div key={label} style={{ width: 300, padding: 24, borderRadius: 24, background: c.white, border: `1.5px solid ${c.surface200}`, display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translate(${from[i][0] * (1 - p)}px, ${from[i][1] * (1 - p)}px)` }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={28} color={col} /></div>
                <div style={{ flex: 1, fontFamily: display, fontWeight: 800, fontSize: 22 }}>{label}</div>
                <div style={{ width: 30, height: 30, borderRadius: 99, background: c.green600, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${done})` }}><Check size={18} color={c.white} strokeWidth={3} /></div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/* ---------- script ---------- */

export const AI_TOOLS: Scene[] = [
  { id: 'hook', dur: s(6), Visual: Hook, text: "A strong application needs strong documents. That's where many applicants get stuck." },
  { id: 'cv', dur: s(10.5), Visual: CvBuilder, text: 'Answer a few focused questions, and the CV Builder turns your own experience into a clean, standard CV, ready for a scholarship panel.' },
  { id: 'sop', dur: s(8), Visual: Sop, text: 'The SOP Generator helps you draft a statement of purpose that sounds like you, not a template.' },
  { id: 'cover', dur: s(5), Visual: CoverLetter, text: 'Cover letters, matched to each role or programme.' },
  { id: 'email', dur: s(6), Visual: ColdEmail, text: 'And short, respectful cold emails to potential supervisors.' },
  { id: 'structure', dur: s(6), Visual: Structure, text: "We've put the structure in place, so you can focus on telling your story." },
  { id: 'share', dark: true, dur: s(7.5), Visual: ShareCta, text: 'Enjoying the benefits? Share Xcel360 with your friends and family, so they can explore these opportunities too.' },
]
