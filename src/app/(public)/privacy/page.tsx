import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Xcel360',
  description:
    'How Xcel360 collects, uses, stores, and protects your personal data - and the rights you have over it.',
}

const LAST_UPDATED = 'January 2025'

const sections = [
  {
    id: 'who-we-are',
    title: '1. Who We Are',
    body: (
      <>
        <p>
          Xcel360 ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is an
          education and opportunity platform that helps students and early-career professionals
          discover scholarships, jobs, internships, mentorship programmes, events, and learning
          resources. When you create an account or interact with our services, we act as the data
          controller for the personal information you provide.
        </p>
        <p>
          This Privacy Policy explains what data we collect, why we collect it, how we use and
          protect it, and the rights you have over your information.
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    body: (
      <>
        <h4 className="font-semibold text-gray-900 mt-4 mb-2">2.1 Information you give us</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Account data:</strong> your name, email address, password (stored only as a
            secure hash), and profile photo if you sign in with Google.
          </li>
          <li>
            <strong>Profile data:</strong> your study level, course of study, degree or
            qualification, school/university, department, target countries, fields of interest,
            short bio, and optionally your WhatsApp number.
          </li>
          <li>
            <strong>Activity data:</strong> opportunities you save, applications you track, and
            notification preferences.
          </li>
          <li>
            <strong>Event registrations:</strong> your name, email, phone number, and answers to
            event-specific questions when you register for our events.
          </li>
          <li>
            <strong>Communications:</strong> messages you send through our contact form and your
            email subscription preferences.
          </li>
        </ul>
        <h4 className="font-semibold text-gray-900 mt-4 mb-2">2.2 Information collected automatically</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Usage and security logs:</strong> sign-in events, administrative actions, IP
            address, and browser user-agent, kept to secure the platform and prevent abuse.
          </li>
          <li>
            <strong>Cookies:</strong> strictly necessary session cookies used to keep you signed
            in. We do not use third-party advertising trackers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Data',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To create and secure your account and authenticate you when you sign in.</li>
        <li>
          <strong>Personalised matching:</strong> to match scholarships, jobs, and internships to
          your study level, course of study, target countries, and fields of interest, and to show
          you a match score on your dashboard.
        </li>
        <li>
          <strong>Notifications and email alerts:</strong> to send you deadline reminders, new
          opportunity alerts that match your profile, weekly digests, and event-related emails -
          only where you have enabled these preferences.
        </li>
        <li>To administer events, issue and verify certificates, and manage mentorship programmes.</li>
        <li>To respond to your enquiries and provide support.</li>
        <li>To keep the platform secure, prevent fraud, and enforce our terms of service.</li>
        <li>To analyse aggregate, de-identified usage trends so we can improve the platform.</li>
      </ul>
    ),
  },
  {
    id: 'legal-basis',
    title: '4. Legal Basis for Processing',
    body: (
      <>
        <p>We process your personal data on the following bases:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong>Contract:</strong> processing needed to provide the account and services you
            signed up for.
          </li>
          <li>
            <strong>Consent:</strong> optional marketing emails and non-essential communications,
            which you can withdraw at any time.
          </li>
          <li>
            <strong>Legitimate interests:</strong> platform security, fraud prevention, and
            service improvement, balanced against your rights.
          </li>
        </ul>
        <p className="mt-2">
          Where applicable, we handle your data in line with the Nigeria Data Protection Act
          (NDPA), the EU/UK General Data Protection Regulation (GDPR), and similar privacy laws.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: '5. How We Share Your Data',
    body: (
      <>
        <p>
          We <strong>never sell</strong> your personal data. We share it only with:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong>Service providers</strong> who help us operate the platform - hosting,
            database, email delivery, and file storage providers - each bound by contractual
            data-protection obligations.
          </li>
          <li>
            <strong>Event and certificate verification:</strong> the name and certificate details
            shown on our public certificate-verification page, so third parties can confirm a
            certificate we issued is genuine.
          </li>
          <li>
            <strong>Legal authorities</strong> where required by law, court order, or to protect
            the rights and safety of our users.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'retention-security',
    title: '6. Data Retention & Security',
    body: (
      <>
        <p>
          We keep your personal data only for as long as your account is active or as needed to
          provide our services. Security and activity logs are retained for a limited period for
          audit purposes. When you delete your account, your personal data is removed or anonymised,
          except where we must retain limited records for legal or fraud-prevention reasons.
        </p>
        <p className="mt-2">
          We protect your data with encryption in transit (HTTPS/TLS), hashed passwords,
          role-based access control, rate limiting, and security headers. No method of transmission
          or storage is 100% secure, but we work continuously to keep your information safe.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    body: (
      <>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong>Access and update</strong> your data at any time from your dashboard profile
            page.
          </li>
          <li>
            <strong>Withdraw consent</strong> to emails - every email includes an unsubscribe
            link, and you can toggle notifications in your profile settings.
          </li>
          <li>
            <strong>Request a copy</strong> of the personal data we hold about you.
          </li>
          <li>
            <strong>Request deletion</strong> of your account and personal data, subject to legal
            retention requirements.
          </li>
          <li>
            <strong>Object to or restrict</strong> certain processing, and to lodge a complaint
            with your local data-protection authority.
          </li>
        </ul>
        <p className="mt-2">
          To exercise any of these rights, email us at{' '}
          <a href="mailto:hello@thexcel360.com" className="text-brand-700 font-medium hover:underline">
            hello@thexcel360.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: '8. Children’s Privacy',
    body: (
      <p>
        Our services are intended for users aged 16 and above. We do not knowingly collect personal
        data from children under 16. If you believe a child has provided us with personal data,
        contact us and we will delete it promptly.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we make material changes, we will
        notify you by email or through a notice on the platform and update the "last updated" date
        above. Continued use of the platform after changes take effect constitutes acceptance of
        the updated policy.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    body: (
      <p>
        Questions, concerns, or requests about your privacy? Reach our team at{' '}
        <a href="mailto:hello@thexcel360.com" className="text-brand-700 font-medium hover:underline">
          hello@thexcel360.com
        </a>{' '}
        or through our{' '}
        <Link href="/contact" className="text-brand-700 font-medium hover:underline">
          contact page
        </Link>
        .
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-hero-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-brand-100 max-w-2xl">
            Your trust matters to us. This policy explains - in plain language - what data Xcel360
            collects, why, and the control you have over it.
          </p>
          <p className="text-sm text-brand-200 mt-4">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Table of contents */}
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

        {/* Sections */}
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
              Privacy questions? Email{' '}
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
