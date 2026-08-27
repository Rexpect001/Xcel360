import type { Metadata } from 'next'
import ContactForm from './ContactForm'
import PageHero from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Have a question about scholarships, mentorship, or the platform? Reach out to the Xcel360 team  -  we respond within 24 hours.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        eyebrow="Get in Touch"
        title="Contact Us"
        subtitle="We'd love to hear from you."
      />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <ContactForm />
      </div>
    </div>
  )
}
