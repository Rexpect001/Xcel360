import {
  User,
  Profile,
  Opportunity,
  SavedOpportunity,
  Application,
  ChecklistItem,
  Notification,
  Event,
  MentorshipOffering,
  BlogPost,
  SuccessStory,
  Role,
  ApplicationStatus,
  OpportunityStatus,
  NotificationType,
} from '@prisma/client'

export type {
  User,
  Profile,
  Opportunity,
  SavedOpportunity,
  Application,
  ChecklistItem,
  Notification,
  Event,
  MentorshipOffering,
  BlogPost,
  SuccessStory,
  Role,
  ApplicationStatus,
  OpportunityStatus,
  NotificationType,
}

export type OpportunityWithRelations = Opportunity & {
  savedBy?: SavedOpportunity[]
  applications?: Application[]
  _count?: {
    savedBy: number
    applications: number
  }
}

export type ApplicationWithOpportunity = Application & {
  opportunity: Opportunity
  checklist: ChecklistItem[]
}

export type UserWithProfile = User & {
  profile: Profile | null
}

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: Role
}

export type OpportunityFilters = {
  search?: string
  programLevel?: string
  field?: string
  country?: string
  fundingType?: string
  status?: OpportunityStatus
  sortBy?: 'deadline' | 'newest' | 'featured'
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'INTERESTED', label: 'Interested', color: 'bg-gray-100 text-gray-700' },
  { value: 'PREPARING', label: 'Preparing', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'SUBMITTED', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  { value: 'INTERVIEW', label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  { value: 'RESULT', label: 'Result', color: 'bg-green-100 text-green-700' },
]

export const PROGRAM_LEVELS = ['Undergrad', 'Masters', 'PhD', 'Postdoc']
export const FIELDS = ['STEM', 'Non-STEM']
export const FIELD_TAGS = [
  'Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Medicine', 'Agriculture', 'Environmental Science',
  'Social Sciences', 'Humanities', 'Arts', 'Law', 'Business',
  'Policy', 'International Relations', 'Education', 'Economics',
]
export const FUNDING_TYPES = ['Fully funded', 'Partial', 'Stipend', 'Tuition waiver']
export const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Japan', 'South Korea',
  'China', 'Singapore', 'New Zealand', 'Switzerland', 'Belgium',
  'Europe (Multiple)', 'Global',
]

export const DEFAULT_CHECKLIST_ITEMS = [
  'CV / Resume',
  'Statement of Purpose (SOP)',
  'Academic Transcripts',
  'Letters of Recommendation',
  'English Proficiency (IELTS/TOEFL)',
  'Research Proposal',
  'Personal Statement',
  'Passport Copy',
]
