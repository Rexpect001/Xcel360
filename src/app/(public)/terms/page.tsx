import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Xcel360',
  description: 'The terms that govern your use of the Xcel360 platform and services.',
}

const LAST_UPDATED = 'January 2025'

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: (
      <p>
        By creating an account or using Xcel360 (the "<strong>Platform</strong>"), you agree to
        these Terms of Service and our{' '}
        <Link href="/privacy" className="text-brand-700 font-medium hover:underline">
          Privacy Policy
        </Link>
        . If you do not agree, please do not use the Platform. You must be at least 16 years old to
        create an account.
      </p>
    ),
  },
  {
    id: 'services',
    title: '2. What We Provide',
    body: (
      <>
        <p>
          Xcel360 is a discovery and support platform for educational and career opportunities.
          Our services include:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Curated listings of scholarships, jobs, internships, and fellowship opportunities.</li>
          <li>Personalised opportunity matching and email alerts based on your profile.</li>
          <li>Application tracking, deadline reminders, and saved-opportunity tools.</li>
          <li>Mentorship programmes, cohort programmes, events, and certificates of participation.</li>
          <li>Downloadable resources, guides, blog content, and success stories.</li>
        </ul>
        <p className="mt-2">
          <strong>Important:</strong> opportunities listed on the Platform are offered by third
          parties. We do not award scholarships, employ applicants, or guarantee admission, funding,
          or outcomes of any kind. Always verify details on the provider&apos;s official page before
          applying.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: '3. Your Account',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You must provide accurate and current information when creating your account.</li>
        <li>You are responsible for keeping your password confidential and for all activity under your account.</li>
        <li>You may update or delete your account at any time from your dashboard or by contacting us.</li>
        <li>
          We may suspend or terminate accounts that violate these terms, abuse the Platform, or
          compromise the security of other users.
        </li>
      </ul>
    ),
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Use the Platform for any unlawful purpose or to post false, misleading, or fraudulent information.</li>
          <li>Scrape, crawl, or bulk-download Platform content without written permission.</li>
          <li>Attempt to gain unauthorised access to accounts, systems, or data.</li>
          <li>Impersonate another person or misrepresent your affiliation.</li>
          <li>Upload malware, or interfere with the Platform&apos;s operation or security.</li>
          <li>Use another person&apos;s certificate or misrepresent a certificate&apos;s authenticity.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'content',
    title: '5. Content & Intellectual Property',
    body: (
      <>
        <p>
          The Xcel360 name, logo, design, and original content are our property and protected by
          intellectual-property laws. Third-party opportunity descriptions remain the property of
          their respective providers.
        </p>
        <p className="mt-2">
          Resources and templates we publish are for your personal, non-commercial use in preparing
          your own applications. You may not resell or republish them as your own.
        </p>
      </>
    ),
  },
  {
    id: 'certificates',
    title: '6. Certificates & Verification',
    body: (
      <p>
        Certificates issued through the Platform reflect participation in the referenced event or
        programme. Each certificate carries a unique ID that can be verified on our public
        verification page. Certificates are non-transferable and may be revoked if issued in error
        or obtained fraudulently.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: '7. Disclaimers & Limitation of Liability',
    body: (
      <>
        <p>
          The Platform is provided "<strong>as is</strong>" and "<strong>as available</strong>"
          without warranties of any kind. While we work to keep listings accurate and current, we
          do not warrant the completeness, accuracy, or availability of any third-party
          opportunity, and deadlines or requirements may change without notice.
        </p>
        <p className="mt-2">
          To the maximum extent permitted by law, Xcel360 is not liable for any indirect,
          incidental, or consequential damages - including lost opportunities, funding, or data -
          arising from your use of the Platform.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: '8. Changes to These Terms',
    body: (
      <p>
        We may update these terms from time to time. Material changes will be announced by email or
        a notice on the Platform, and the "last updated" date will be revised. Continued use after
        changes take effect constitutes acceptance.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '9. Contact',
    body: (
      <p>
        Questions about these terms? Email{' '}
        <a href="mailto:hello@thexcel360.com" className="text-brand-700 font-medium hover:underline">
          hello@thexcel360.com
        </a>{' '}
        or visit our{' '}
        <Link href="/contact" className="text-brand-700 font-medium hover:underline">
          contact page
        </Link>
        .
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-hero-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-brand-100 max-w-2xl">
            The ground rules for using Xcel360 - what we provide, what we ask of you, and how we
            both stay protected.
          </p>
          <p className="text-sm text-brand-200 mt-4">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            On this page
          </h2>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-brand-700 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h2>
              <div className="text-gray-600 text-[15px] leading-relaxed space-y-3">{s.body}</div>
            </section>
          ))}

          <div className="border-t border-gray-100 pt-6 flex items-center gap-3 text-sm text-gray-500">
            <Mail className="h-4 w-4 text-brand-600" />
            <span>
              Questions about these terms? Email{' '}
              <a
                href="mailto:hello@thexcel360.com"
                className="text-brand-700 font-medium hover:underline"
              >
                hello@thexcel360.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
