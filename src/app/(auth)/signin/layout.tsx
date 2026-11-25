import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Xcel360 to see your scholarship matches, saved opportunities, deadline reminders and writing tools.',
  alternates: { canonical: '/signin' },
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children
}
