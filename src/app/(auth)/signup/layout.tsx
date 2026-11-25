import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create a Free Account',
  description: 'Join Xcel360 free: get scholarships matched to your level and field, deadline reminders, and CV, SOP and cover letter tools.',
  alternates: { canonical: '/signup' },
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children
}
