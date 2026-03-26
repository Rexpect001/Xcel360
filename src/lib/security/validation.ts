import { z } from 'zod'

// User registration schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
})

export type RegisterInput = z.infer<typeof registerSchema>

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Profile update schema
export const profileUpdateSchema = z.object({
  level: z.enum(['Undergrad', 'Masters', 'PhD', 'Postdoc']).nullable().optional(),
  targetCountries: z.array(z.string()).max(20, 'Too many countries selected').optional(),
  targetFields: z.array(z.string()).max(20, 'Too many fields selected').optional(),
  bio: z.string().max(1000, 'Bio is too long').nullable().optional(),
  whatsappNumber: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format')
    .nullable()
    .optional(),
  school: z.string().min(2).max(200).nullable().optional(),
  department: z.string().min(2).max(200).nullable().optional(),
  notifyEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
  reminderDays: z.array(z.number().min(1).max(365)).max(10).optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

// Opportunity schema
export const opportunitySchema = z.object({
  title: z.string().min(5).max(500),
  category: z.enum(['SCHOLARSHIP', 'JOB', 'INTERNSHIP']).optional(),
  programLevel: z.array(z.enum(['Undergrad', 'Masters', 'PhD', 'Postdoc'])).min(0).default([]),
  field: z.enum(['STEM', 'Non-STEM']),
  fieldTags: z.array(z.string()).max(20),
  country: z.string().min(2).max(100),
  region: z.string().max(100).nullable().optional(),
  hostOrg: z.string().min(2).max(200),
  fundingType: z.enum(['Fully funded', 'Partial', 'Stipend', 'Tuition waiver', 'Paid', 'Unpaid', 'Competitive salary']).default('Fully funded'),
  deadline: z.string().datetime(),
  eligibility: z.string().min(5).max(10000),
  requiredDocs: z.array(z.string()).max(50),
  applicationLink: z.string().url(),
  description: z.string().max(10000).nullable().optional(),
  featured: z.boolean().optional(),
  // Job/Internship-specific fields
  jobType: z.string().max(50).nullable().optional(),
  salary: z.string().max(100).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  remote: z.boolean().optional(),
  experienceLevel: z.string().max(50).nullable().optional(),
  skills: z.array(z.string()).max(20).optional(),
})

export type OpportunityInput = z.infer<typeof opportunitySchema>

// Application status update schema
export const applicationUpdateSchema = z.object({
  status: z.enum(['INTERESTED', 'PREPARING', 'SUBMITTED', 'INTERVIEW', 'RESULT']).optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>

// Checklist item update schema
export const checklistUpdateSchema = z.object({
  completed: z.boolean(),
})

export type ChecklistUpdateInput = z.infer<typeof checklistUpdateSchema>

// Email subscription schema
export const emailSubscribeSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
})

export type EmailSubscribeInput = z.infer<typeof emailSubscribeSchema>

// Validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return { success: false, errors: result.error }
  }
  
  return { success: true, data: result.data }
}
