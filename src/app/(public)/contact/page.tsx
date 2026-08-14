import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Have a question about scholarships, mentorship, or the platform? Reach out to the Xcel360 team  -  we respond within 24 hours.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-blue-200 text-lg">We&apos;d love to hear from you.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <ContactForm />
      </div>
    </div>
  )
}
