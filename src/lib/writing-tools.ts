/**
 * Xcel360 writing and startup tools - shared definitions used by both the dashboard
 * forms and the /api/pro/writing route. The server only ever reads the field
 * ids declared here, so the prompt shape is fixed and user input stays data.
 */

export type ToolId = 'cv' | 'sop' | 'cover-letter' | 'cold-email' | 'startup-idea' | 'startup-interviews' | 'startup-roadmap'

export interface ToolField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
  section?: string
  help?: string
  placeholder?: string
  options?: string[]
  required?: boolean
  /** Prefill key from the user's profile/session. */
  prefill?: 'name' | 'level' | 'course' | 'school' | 'degree' | 'gradYear' | 'countries'
  max?: number
}

export interface ToolDef {
  id: ToolId
  name: string
  tagline: string
  outputLabel: string
  fields: ToolField[]
  /** Task description handed to the model, with the user's fields appended as data. */
  task: string
}

export const WRITING_TOOLS: Record<ToolId, ToolDef> = {
  cv: {
    id: 'cv',
    name: 'Academic CV Builder',
    tagline: 'Answer focused questions, then turn your own evidence into an academic CV.',
    outputLabel: 'Your CV draft',
    task:
      'Write a tailored academic CV for the stated scholarship, graduate programme, or role. Prioritise the strongest relevant evidence rather than forcing a fixed length. Use reverse chronological order, clear headings, and concise bullets showing action, method or skill, and result where the applicant supplied them. Put research and thesis evidence early for research-focused applications; include teaching, leadership, awards, conferences, certifications, publications, and referees only when supported and relevant. Do not invent metrics, publications, credentials, duties, dates, or referee details. Omit empty sections. Do not include private details such as date of birth, marital status, or a photograph unless explicitly required by the target. Return only the CV in plain text, with headings and "- " bullets.',
    fields: [
      { id: 'name', section: 'Goal and contact', label: 'Full name', type: 'text', required: true, prefill: 'name', max: 120 },
      { id: 'target', label: 'Which scholarship, programme, research field, or role is this CV for?', type: 'text', required: true, placeholder: 'MSc Public Health scholarship; focus on epidemiology', max: 240 },
      { id: 'criteria', label: 'What does the selection committee ask for?', type: 'textarea', help: 'Paste the relevant requirements or selection criteria, not the whole advert.', max: 1800 },
      { id: 'contact', label: 'Professional email, phone, city, and useful profile link', type: 'text', placeholder: 'ada@email.com; Lagos; linkedin.com/in/ada', max: 320 },
      { id: 'education', section: 'Academic foundation', label: 'For each degree: qualification, field, university, dates, grade, and honours', type: 'textarea', required: true, prefill: 'school', placeholder: 'BSc Microbiology, University of Ibadan, 2019-2023; Second Class Upper, 4.21/5.00', max: 2500 },
      { id: 'researchInterests', label: 'Which specific research interests fit this application?', type: 'textarea', help: 'Name focused topics you can explain. Leave blank for a non-research role.', max: 900 },
      { id: 'thesis', section: 'Research and projects', label: 'What was your thesis or strongest project?', type: 'textarea', help: 'Give its title, question, your contribution, methods/tools, and findings. Say what is still unknown.', max: 2200 },
      { id: 'research', label: 'What other research have you done?', type: 'textarea', help: 'For each project: your role, dates, methods, skills used, and result. Leave blank if none.', max: 2500 },
      { id: 'publications', label: 'Publications, presentations, or manuscripts', type: 'textarea', help: 'Only list real work. Give title, authors, venue, year, and status (published, accepted, under review).', max: 1600 },
      { id: 'teaching', section: 'Experience and impact', label: 'Have you taught, tutored, or supervised others?', type: 'textarea', help: 'Who did you teach, what subject, what did you do, and what changed?', max: 1400 },
      { id: 'experience', label: 'Relevant work, internships, and service', type: 'textarea', required: true, help: 'For each role: organisation, years, the problem, your action, tools or skills used, and an honest result. Coursework and class projects count if you have no formal job.', max: 4200 },
      { id: 'leadership', label: 'Leadership and volunteering with outcomes', type: 'textarea', help: 'Pick the strongest relevant examples; describe your contribution and result.', max: 1800 },
      { id: 'awards', section: 'Supporting evidence', label: 'What are your most relevant academic awards or honours?', type: 'textarea', help: 'Prioritise up to three strong awards and give the year and basis for each.', max: 1100 },
      { id: 'conferences', label: 'Relevant conferences, certifications, and memberships', type: 'textarea', help: 'State your role or what you learned; leave unrelated items out.', max: 1300 },
      { id: 'skills', label: 'Technical tools, methods, and languages you can actually use', type: 'textarea', help: 'Name your level or evidence of use where helpful.', max: 1300 },
      { id: 'referees', label: 'Referees, only if requested and they have agreed', type: 'textarea', help: 'Name, role, institution, professional email, and relationship. Otherwise leave blank.', max: 900 },
    ],
  },
  sop: {
    id: 'sop',
    name: 'SOP Generator',
    tagline: 'Draft a focused statement of purpose that sounds like you, not a template.',
    outputLabel: 'Your statement of purpose draft',
    task:
      'Write a statement of purpose for the programme and scholarship below. Open with a specific moment or problem from the applicant\'s own story (not a quote, not "Since I was a child"). Then cover: academic preparation, relevant experience, why this programme and this university specifically, concrete goals for the next 5 years, and how the applicant will contribute back home. Respect the word limit. Return only the essay in plain paragraphs.',
    fields: [
      { id: 'name', label: 'Your name', type: 'text', prefill: 'name', max: 120 },
      { id: 'programme', label: 'Programme and university', type: 'text', required: true, placeholder: 'MSc Global Health Policy, University of Edinburgh', max: 200 },
      { id: 'scholarship', label: 'Scholarship (if any)', type: 'text', placeholder: 'Commonwealth Shared Scholarship', max: 200 },
      { id: 'background', label: 'Academic background', type: 'textarea', required: true, prefill: 'course', placeholder: 'Degree, school, grade, key courses, final-year project…', max: 2000 },
      { id: 'story', label: 'The moment or problem that drives you', type: 'textarea', required: true, placeholder: 'A real experience that made you choose this field…', max: 2000 },
      { id: 'experience', label: 'Relevant experience', type: 'textarea', max: 2500 },
      { id: 'goals', label: 'Career goals and impact back home', type: 'textarea', required: true, max: 1500 },
      { id: 'words', label: 'Word limit', type: 'select', options: ['500', '750', '1000', '1500'], max: 10 },
    ],
  },
  'cover-letter': {
    id: 'cover-letter',
    name: 'Cover Letter Builder',
    tagline: 'A one-page cover letter matched to the role or programme you are applying for.',
    outputLabel: 'Your cover letter draft',
    task:
      'Write a one-page cover letter (250-400 words). Address it to the named person or "Dear Hiring Committee". First paragraph: the role and one sentence on why the applicant is a strong fit. Middle: two short paragraphs mapping the applicant\'s evidence to the stated requirements. Close with availability and a confident, polite call to action. Return only the letter.',
    fields: [
      { id: 'name', label: 'Your name', type: 'text', required: true, prefill: 'name', max: 120 },
      { id: 'role', label: 'Role or programme', type: 'text', required: true, placeholder: 'Research Intern, WHO Africa Regional Office', max: 200 },
      { id: 'recipient', label: 'Recipient (if known)', type: 'text', placeholder: 'Dr. Amina Bello, Programme Lead', max: 150 },
      { id: 'requirements', label: 'What are they looking for?', type: 'textarea', required: true, placeholder: 'Paste the key requirements from the advert…', max: 3000 },
      { id: 'evidence', label: 'Your most relevant experience', type: 'textarea', required: true, max: 3000 },
      { id: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Warm and professional', 'Formal'], max: 40 },
    ],
  },
  'cold-email': {
    id: 'cold-email',
    name: 'Cold Email Generator',
    tagline: 'Short, respectful emails to potential supervisors and scholarship offices.',
    outputLabel: 'Your email draft',
    task:
      'Write a cold email under 200 words with a specific subject line (first line: "Subject: ..."). Mention one concrete detail about the recipient\'s work that the applicant provided, connect it to the applicant\'s background in two sentences, make one clear ask, and close politely. No flattery, no attachments promised unless the applicant listed them. Return the subject line and the email only.',
    fields: [
      { id: 'name', label: 'Your name', type: 'text', required: true, prefill: 'name', max: 120 },
      { id: 'recipient', label: 'Recipient and their role', type: 'text', required: true, placeholder: 'Prof. Kofi Mensah, Dept. of Soil Science, Wageningen', max: 200 },
      { id: 'purpose', label: 'What are you asking for?', type: 'select', options: ['PhD supervision', 'Masters research supervision', 'Research assistant position', 'Scholarship eligibility question', 'Internship'], required: true, max: 80 },
      { id: 'theirWork', label: 'Something specific about their work', type: 'textarea', required: true, placeholder: 'Their 2024 paper on cassava drought resistance…', max: 1500 },
      { id: 'background', label: 'Your background in 2-3 lines', type: 'textarea', required: true, prefill: 'course', max: 1500 },
      { id: 'attachments', label: 'Attachments you will include', type: 'text', placeholder: 'CV, transcript, research proposal', max: 200 },
    ],
  },
  'startup-idea': {
    id: 'startup-idea',
    name: 'Idea validator',
    tagline: 'Turn a startup idea into clear assumptions and small tests.',
    outputLabel: 'Your idea validation plan',
    task: 'Assess this startup idea as a set of hypotheses, not a proven business. Return sections: Problem, Likely customer, Current alternatives, Riskiest assumptions, Five low-cost tests, Success signals, Next decision. Label every unverified claim as an assumption. Do not invent market size, competitors, customers, revenue or research.',
    fields: [
      { id: 'idea', label: 'Describe your idea in one or two sentences', type: 'textarea', required: true, max: 1000 },
      { id: 'customer', label: 'Who would use or pay for it?', type: 'textarea', required: true, max: 800 },
      { id: 'problem', label: 'What problem have you observed?', type: 'textarea', required: true, max: 1200 },
      { id: 'evidence', label: 'What evidence do you already have?', type: 'textarea', placeholder: 'Conversations, surveys, pilots or direct observations. Leave blank if none.', max: 1500 },
      { id: 'location', label: 'Where would you start?', type: 'text', max: 120 },
    ],
  },
  'startup-interviews': {
    id: 'startup-interviews',
    name: 'Customer interview guide',
    tagline: 'Ask questions that reveal real problems without leading people.',
    outputLabel: 'Your interview guide',
    task: 'Create a 20-minute customer discovery interview guide. Include a short introduction, 8 open questions about past behavior and the current problem, follow-up probes, what to record, and how to identify weak evidence. Avoid pitching the solution or asking whether people would buy it.',
    fields: [
      { id: 'idea', label: 'Your startup idea', type: 'textarea', required: true, max: 1000 },
      { id: 'customer', label: 'Who will you interview?', type: 'textarea', required: true, max: 800 },
      { id: 'problem', label: 'What problem are you testing?', type: 'textarea', required: true, max: 1000 },
      { id: 'unknowns', label: 'What are you most unsure about?', type: 'textarea', max: 1000 },
    ],
  },
  'startup-roadmap': {
    id: 'startup-roadmap',
    name: '30-day startup roadmap',
    tagline: 'Build a practical first month around learning and measurable milestones.',
    outputLabel: 'Your 30-day plan',
    task: 'Create a four-week startup roadmap for an early founder. For each week give a goal, at most three concrete actions, a deliverable, and a decision point. Prioritize customer discovery before building. Fit the plan to the founder’s stated time and budget. Do not assume resources or traction that were not supplied.',
    fields: [
      { id: 'idea', label: 'Your startup idea', type: 'textarea', required: true, max: 1000 },
      { id: 'stage', label: 'What have you done so far?', type: 'textarea', required: true, max: 1200 },
      { id: 'customer', label: 'Target customer', type: 'textarea', required: true, max: 800 },
      { id: 'time', label: 'Hours available each week', type: 'text', required: true, max: 50 },
      { id: 'budget', label: 'Budget and resources', type: 'textarea', max: 800 },
    ],
  },
}

export const TOOL_ORDER = ['cv', 'sop', 'cover-letter', 'cold-email'] as const
export const STARTUP_TOOL_ORDER = ['startup-idea', 'startup-interviews', 'startup-roadmap'] as const

export function isToolId(v: unknown): v is ToolId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(WRITING_TOOLS, v)
}

/** The bits of an opportunity listing the forms need. */
export interface OpportunitySummary {
  id: string
  title: string
  org: string
  category: string
  eligibility: string
  skills: string[]
}

/** Which tools can be tailored to a listing, by category. */
export function toolsForOpportunity(category: string): ToolId[] {
  return category === 'SCHOLARSHIP' ? ['cv', 'sop', 'cover-letter'] : ['cv', 'cover-letter']
}

/**
 * Field values to fill from a listing. These fill only the "what are you applying for"
 * fields; facts about the applicant always come from the applicant.
 */
export function opportunityPrefill(toolId: ToolId, opp: OpportunitySummary): Record<string, string> {
  const criteria = opp.eligibility.replace(/\s+\n/g, '\n').trim()
  switch (toolId) {
    case 'cv':
      return { target: `${opp.title} (${opp.org})`.slice(0, 240), criteria: criteria.slice(0, 1800) }
    case 'sop':
      return { scholarship: `${opp.title} (${opp.org})`.slice(0, 200) }
    case 'cover-letter':
      return {
        role: `${opp.title}, ${opp.org}`.slice(0, 200),
        requirements: [criteria, opp.skills.length ? `Skills: ${opp.skills.join(', ')}` : ''].filter(Boolean).join('\n\n').slice(0, 3000),
      }
    default:
      return {}
  }
}
