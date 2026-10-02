/**
 * Xcel360 Pro writing tools - shared definitions used by both the dashboard
 * forms and the /api/pro/writing route. The server only ever reads the field
 * ids declared here, so the prompt shape is fixed and user input stays data.
 */

export type ToolId = 'cv' | 'sop' | 'cover-letter' | 'cold-email'

export interface ToolField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
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
    name: 'CV Builder',
    tagline: 'Turn your experience into a clean, scholarship-ready academic CV.',
    outputLabel: 'Your CV draft',
    task:
      'Write a two-page academic CV for a scholarship or graduate-school application. Use clear section headings (Profile, Education, Research & Projects, Experience, Leadership & Volunteering, Awards, Skills, Publications if any, Referees: "Available on request"). Use reverse chronological order and concise achievement bullets that start with a strong verb and include numbers where the applicant gave them. Plain text with simple headings and "- " bullets so it pastes cleanly into Word or Google Docs.',
    fields: [
      { id: 'name', label: 'Full name', type: 'text', required: true, prefill: 'name', max: 120 },
      { id: 'contact', label: 'Email, phone, city, LinkedIn', type: 'text', placeholder: 'ada@email.com · +234 800 000 0000 · Lagos · linkedin.com/in/ada', max: 300 },
      { id: 'target', label: 'What is this CV for?', type: 'text', required: true, placeholder: 'Chevening Masters in Public Health, UK', max: 200 },
      { id: 'education', label: 'Education', type: 'textarea', required: true, prefill: 'school', placeholder: 'B.Sc Microbiology, University of Ibadan, 2019-2023, Second Class Upper (4.21/5)…', max: 2000 },
      { id: 'experience', label: 'Work, research and internships', type: 'textarea', placeholder: 'Role, organisation, dates, what you did and what changed because of it…', max: 4000 },
      { id: 'leadership', label: 'Leadership, volunteering, awards', type: 'textarea', max: 2000 },
      { id: 'skills', label: 'Skills, tools, languages, certifications', type: 'textarea', max: 1000 },
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
}

export const TOOL_ORDER: ToolId[] = ['cv', 'sop', 'cover-letter', 'cold-email']

export function isToolId(v: unknown): v is ToolId {
  return typeof v === 'string' && v in WRITING_TOOLS
}
