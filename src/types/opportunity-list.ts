import type { Opportunity } from '@prisma/client'

export type OpportunityListItem = Pick<
  Opportunity,
  | 'id'
  | 'title'
  | 'category'
  | 'programLevel'
  | 'field'
  | 'fieldTags'
  | 'country'
  | 'hostOrg'
  | 'fundingType'
  | 'deadline'
  | 'featured'
  | 'status'
  | 'applicationLink'
  | 'createdAt'
  | 'imageUrl'
  | 'jobType'
  | 'company'
  | 'salary'
  | 'remote'
  | 'experienceLevel'
  | 'skills'
  | 'description'
  | 'eligibility'
>

export const opportunityListSelect = {
  id: true,
  title: true,
  category: true,
  programLevel: true,
  field: true,
  fieldTags: true,
  country: true,
  hostOrg: true,
  fundingType: true,
  deadline: true,
  featured: true,
  status: true,
  applicationLink: true,
  createdAt: true,
  imageUrl: true,
  jobType: true,
  company: true,
  salary: true,
  remote: true,
  experienceLevel: true,
  skills: true,
  description: true,
  eligibility: true,
} as const
