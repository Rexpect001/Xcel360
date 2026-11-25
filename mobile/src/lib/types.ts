/** Shapes returned by /api/mobile/v1 on thexcel360.com. */

export interface SessionUser { id: string; email: string; name: string | null; role: string }
export interface Session {
  token: string
  refreshToken: string
  expiresAt: string
  refreshExpiresAt: string
  user: SessionUser
}

export type Category = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP'

export interface ListingCard {
  id: string
  title: string
  org: string
  monogram: string
  country: string
  fundingType: string
  deadline: string | null
  programLevel: string[]
  category: Category
  featured: boolean
  remote: boolean
  jobType: string | null
  snippet: string
}

export interface ListingPage {
  data: ListingCard[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface ListingDetail extends ListingCard {
  hostOrg: string
  company: string | null
  region: string | null
  field: string
  fieldTags: string[]
  eligibility: string
  description: string | null
  requiredDocs: string[]
  applicationLink: string
  imageUrl: string | null
  salary: string | null
  experienceLevel: string | null
  skills: string[]
  closed: boolean
  saved: boolean
  webUrl: string
  topics: { slug: string; label: string }[]
}

export interface SavedItem extends ListingCard { savedAt: string; closed: boolean }

export interface Me {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  profileCompleteness: number
  credits: number | null
  unreadNotifications: number
  profile: {
    level: string | null
    targetCountries: string[]
    targetFields: string[]
    courseOfStudy: string | null
    degree: string | null
    school: string | null
  } | null
}

export interface HomeData {
  firstName: string | null
  profileCompleteness: number
  matchCount: number
  matches: (ListingCard & { score: number; reasons: string[] })[]
  closingSoon: { id: string; title: string; org: string; deadline: string | null }[]
  latestNotice: { id: string; title: string; message: string; link: string | null; createdAt: string } | null
  unreadNotifications: number
  topics: { slug: string; label: string; count: number }[]
}

export interface NotificationItem {
  id: string
  type: 'DEADLINE_REMINDER' | 'NEW_OPPORTUNITY' | 'APPLICATION_UPDATE' | 'GENERAL'
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface Profile {
  level: 'Undergrad' | 'Masters' | 'PhD' | 'Postdoc' | null
  targetCountries: string[]
  targetFields: string[]
  courseOfStudy: string | null
  degree: string | null
  school: string | null
  department: string | null
  graduationYear: number | null
  notifyEmail: boolean
  notifyInApp: boolean
  completeness: number
}

export interface Referral { code: string; link: string; perFriend: number; max: number; rewards: number; credits: number; remaining: number }

export interface ToolField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
  display?: 'segmented'
  tracks?: ('academic' | 'job')[]
  section?: string
  help?: string
  placeholder?: string
  options?: string[]
  required?: boolean
  max?: number
}

export interface ToolSummary { id: string; name: string; tagline: string; credits: number }

export interface DraftCheck { code: string; level: 'info' | 'warn' | 'block'; message: string; items?: string[] }

export interface ToolForm {
  id: string
  name: string
  tagline: string
  outputLabel: string
  credits: number
  fields: ToolField[]
  values: Record<string, string>
  opportunity: { id: string; title: string; org: string } | null
  draft: { id: string; output: string; hasPrevious: boolean; updatedAt: string } | null
}

export interface DraftSummary { id: string; tool: string; toolName: string; title: string; updatedAt: string }

export interface LegalDoc {
  title: string
  intro: string
  lastUpdated: string
  sections: { id: string; title: string; blocks: ({ p: string } | { h: string } | { ul: string[] })[] }[]
}

export interface TopicSummary { slug: string; kind: 'level' | 'country' | 'field'; label: string; title: string; count: number }

export interface TopicDetail {
  slug: string
  kind: string
  title: string
  description: string
  intro: string[]
  tips: string[]
  related: { slug: string; label: string }[]
  stats: { total: number; fullyFunded: number; closingIn30: number; rolling: number; nextDeadline: string | null }
  listings: ListingCard[]
}
