/**
 * Terms of Service and Privacy Policy, shared by the website pages (/terms,
 * /privacy) and the mobile app (/api/mobile/v1/legal/{kind}), so both always
 * show the same words.
 *
 * Inline markup: **bold**, [label](href). href is a site path (/contact), an
 * in-page anchor (#cookies-advertising), mailto:, or an https link.
 */
export type LegalBlock = { p: string } | { h: string } | { ul: string[] }

export interface LegalSection {
  id: string
  title: string
  blocks: LegalBlock[]
}

export interface LegalDoc {
  title: string
  intro: string
  lastUpdated: string
  sections: LegalSection[]
}

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  intro: 'The ground rules for using Xcel360 - what we provide, what we ask of you, and how we both stay protected.',
  lastUpdated: 'January 2025',
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      blocks: [
        { p: 'By creating an account or using Xcel360 (the "**Platform**"), you agree to these Terms of Service and our [Privacy Policy](/privacy). If you do not agree, please do not use the Platform. You must be at least 16 years old to create an account.' },
      ],
    },
    {
      id: 'services',
      title: '2. What We Provide',
      blocks: [
        { p: 'Xcel360 is a discovery and support platform for educational and career opportunities. Our services include:' },
        { ul: [
          'Curated listings of scholarships, jobs, internships, and fellowship opportunities.',
          'Personalised opportunity matching and email alerts based on your profile.',
          'Application tracking, deadline reminders, and saved-opportunity tools.',
          'Mentorship programmes, cohort programmes, events, and certificates of participation.',
          'Downloadable resources, guides, blog content, and success stories.',
        ] },
        { p: "**Important:** opportunities listed on the Platform are offered by third parties. We do not award scholarships, employ applicants, or guarantee admission, funding, or outcomes of any kind. Always verify details on the provider's official page before applying." },
      ],
    },
    {
      id: 'accounts',
      title: '3. Your Account',
      blocks: [
        { ul: [
          'You must provide accurate and current information when creating your account.',
          'You are responsible for keeping your password confidential and for all activity under your account.',
          'You may update or delete your account at any time from your dashboard or by contacting us.',
          'We may suspend or terminate accounts that violate these terms, abuse the Platform, or compromise the security of other users.',
        ] },
      ],
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable Use',
      blocks: [
        { p: 'You agree not to:' },
        { ul: [
          'Use the Platform for any unlawful purpose or to post false, misleading, or fraudulent information.',
          'Scrape, crawl, or bulk-download Platform content without written permission.',
          'Attempt to gain unauthorised access to accounts, systems, or data.',
          'Impersonate another person or misrepresent your affiliation.',
          "Upload malware, or interfere with the Platform's operation or security.",
          "Use another person's certificate or misrepresent a certificate's authenticity.",
        ] },
      ],
    },
    {
      id: 'content',
      title: '5. Content & Intellectual Property',
      blocks: [
        { p: 'The Xcel360 name, logo, design, and original content are our property and protected by intellectual-property laws. Third-party opportunity descriptions remain the property of their respective providers.' },
        { p: 'Resources and templates we publish are for your personal, non-commercial use in preparing your own applications. You may not resell or republish them as your own.' },
      ],
    },
    {
      id: 'certificates',
      title: '6. Certificates & Verification',
      blocks: [
        { p: 'Certificates issued through the Platform reflect participation in the referenced event or programme. Each certificate carries a unique ID that can be verified on our public verification page. Certificates are non-transferable and may be revoked if issued in error or obtained fraudulently.' },
      ],
    },
    {
      id: 'disclaimers',
      title: '7. Disclaimers & Limitation of Liability',
      blocks: [
        { p: 'The Platform is provided "**as is**" and "**as available**" without warranties of any kind. While we work to keep listings accurate and current, we do not warrant the completeness, accuracy, or availability of any third-party opportunity, and deadlines or requirements may change without notice.' },
        { p: 'To the maximum extent permitted by law, Xcel360 is not liable for any indirect, incidental, or consequential damages - including lost opportunities, funding, or data - arising from your use of the Platform.' },
      ],
    },
    {
      id: 'changes',
      title: '8. Changes to These Terms',
      blocks: [
        { p: 'We may update these terms from time to time. Material changes will be announced by email or a notice on the Platform, and the "last updated" date will be revised. Continued use after changes take effect constitutes acceptance.' },
      ],
    },
    {
      id: 'contact',
      title: '9. Contact',
      blocks: [
        { p: 'Questions about these terms? Email [hello@thexcel360.com](mailto:hello@thexcel360.com) or visit our [contact page](/contact).' },
      ],
    },
  ],
}

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  intro: 'Your trust matters to us. This policy explains - in plain language - what data Xcel360 collects, why, and the control you have over it.',
  lastUpdated: 'November 2026',
  sections: [
    {
      id: 'who-we-are',
      title: '1. Who We Are',
      blocks: [
        { p: 'Xcel360 ("**we**", "**us**", "**our**") is an education and opportunity platform that helps students and early-career professionals discover scholarships, jobs, internships, mentorship programmes, events, and learning resources. When you create an account or interact with our services, we act as the data controller for the personal information you provide.' },
        { p: 'This Privacy Policy explains what data we collect, why we collect it, how we use and protect it, and the rights you have over your information.' },
      ],
    },
    {
      id: 'data-we-collect',
      title: '2. Data We Collect',
      blocks: [
        { h: '2.1 Information you give us' },
        { ul: [
          '**Account data:** your name, email address, password (stored only as a secure hash), and profile photo if you sign in with Google.',
          '**Profile data:** your study level, course of study, degree or qualification, school/university, department, target countries, fields of interest, short bio, and optionally your WhatsApp number.',
          '**Activity data:** opportunities you save, applications you track, and notification preferences.',
          '**Event registrations:** your name, email, phone number, and answers to event-specific questions when you register for our events.',
          '**Communications:** messages you send through our contact form and your email subscription preferences.',
          '**Payment data:** if you pay for a premium service, our payment processor (Paystack) collects your payment details on its own secure checkout. We never see or store your card number - we only receive the payment confirmation, your plan, and a transaction reference.'
        ] },
        { h: '2.2 Information collected automatically' },
        { ul: [
          '**Usage and security logs:** sign-in events, administrative actions, IP address, and browser user-agent, kept to secure the platform and prevent abuse.',
          '**Analytics data:** our analytics provider (Sabilytics) collects aggregate, non-identifying usage statistics - pages visited, referring site, approximate region, and device and browser type - so we can understand overall site traffic. These statistics are not tied to your account.',
          '**Cookies:** strictly necessary session cookies used to keep you signed in, plus advertising cookies and similar technologies set by Google AdSense and its partners (see [section 6](#cookies-advertising)).',
          '**Device and ad data:** when ads are shown, Google may collect your IP address, browser and device type, approximate location, the pages you visit on our site, and how you interact with ads.',
          '**Mobile app:** if you use the Xcel360 app and allow notifications, we store a push notification token for your device so we can send you deadline reminders and updates. Sign out or turn off notifications to stop them.',
        ] },
      ],
    },
    {
      id: 'how-we-use',
      title: '3. How We Use Your Data',
      blocks: [
        { ul: [
          'To create and secure your account and authenticate you when you sign in.',
          '**Personalised matching:** to match scholarships, jobs, and internships to your study level, course of study, target countries, and fields of interest, and to show you a match score on your dashboard.',
          '**Notifications and email alerts:** to send you deadline reminders, new opportunity alerts that match your profile, weekly digests, and event-related emails - only where you have enabled these preferences.',
          'To administer events, issue and verify certificates, and manage mentorship programmes.',
          'To respond to your enquiries and provide support.',
          'To keep the platform secure, prevent fraud, and enforce our terms of service.',
          'To analyse aggregate, de-identified usage trends so we can improve the platform.',
          '**Advertising:** to display ads through Google AdSense, which helps keep Xcel360 free for students. We never share your profile, saved opportunities, or application data with advertisers.',
        ] },
      ],
    },
    {
      id: 'legal-basis',
      title: '4. Legal Basis for Processing',
      blocks: [
        { p: 'We process your personal data on the following bases:' },
        { ul: [
          '**Contract:** processing needed to provide the account and services you signed up for.',
          '**Consent:** optional marketing emails, non-essential communications, and - for visitors in the EEA, UK, and Switzerland - advertising cookies and personalised ads. You can withdraw consent at any time.',
          '**Legitimate interests:** platform security, fraud prevention, and service improvement, balanced against your rights.',
        ] },
        { p: 'Where applicable, we handle your data in line with the Nigeria Data Protection Act (NDPA), the EU/UK General Data Protection Regulation (GDPR), and similar privacy laws.' },
      ],
    },
    {
      id: 'sharing',
      title: '5. How We Share Your Data',
      blocks: [
        { p: 'We **never sell** your personal data. We share it only with:' },
        { ul: [
          '**Service providers** who help us operate the platform, each bound by contractual data-protection obligations. These include: hosting and database infrastructure (Microsoft Azure), file storage (Azure Blob Storage), email delivery (Resend), payment processing (Paystack, for premium billing), push-notification delivery for the mobile app, and privacy-focused analytics (Sabilytics).',
          '**Event and certificate verification:** the name and certificate details shown on our public certificate-verification page, so third parties can confirm a certificate we issued is genuine.',
          '**Advertising partners:** Google and its certified ad partners receive the device and cookie data described in section 2.2 when they serve ads on our pages. See [section 6](#cookies-advertising) for details and how to opt out.',
          '**Legal authorities** where required by law, court order, or to protect the rights and safety of our users.',
        ] },
        { p: '**International transfers:** several of the providers above operate outside Nigeria, so your data may be processed in other countries, including the United States and the European Union. Where data crosses borders, it is protected by the data-processing agreements and safeguards those providers maintain, and by the transfer mechanisms recognised under the NDPA and GDPR.' },
      ],
    },
    {
      id: 'cookies-advertising',
      title: '6. Cookies & Advertising',
      blocks: [
        { p: 'Cookies are small text files stored on your device. We use as few as possible, and we rely on advertising to keep Xcel360 free.' },
        { h: '6.1 Types of cookies we use' },
        { ul: [
          '**Strictly necessary:** session and security cookies that keep you signed in and protect forms from abuse. The site cannot work without them, so they do not require consent.',
          '**Advertising:** cookies and similar identifiers set by Google and its partners to show ads, limit how often you see the same ad, measure ad performance, and detect ad fraud.',
        ] },
        { p: 'For full detail, the cookies we set ourselves are:' },
        { ul: [
          '**Session cookie** (set by our sign-in system): keeps you logged in. Strictly necessary. Expires when you sign out or after 30 days of inactivity.',
          '**`xcel_ref` referral cookie:** remembers a referral code from a sign-up link so we can credit the person who invited you. Lasts 30 days and contains no personal data beyond the code itself.',
          '**`xcel360_announcement_dismissed`:** remembers that you dismissed the announcement bar so we do not show it again. Stored on your device only.',
        ] },
        { p: 'Google and its partners set their own cookies when ads are served; their names and durations vary and are described in [Google’s cookie documentation](https://policies.google.com/technologies/cookies).' },
        { h: '6.2 Google AdSense' },
        { ul: [
          'Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.',
          "Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to Xcel360 and/or other sites on the Internet.",
          "Other certified ad vendors and networks may also serve ads on our site. You can see the list of Google's ad technology providers in the [Google ad tech providers list](https://support.google.com/admanager/answer/9012903).",
          "Data collected by Google is processed under [Google's Privacy Policy](https://policies.google.com/privacy) and may be transferred to and processed in the United States and other countries. Learn more at [How Google uses information from sites that use its services](https://policies.google.com/technologies/partner-sites).",
        ] },
        { h: '6.3 Your consent and choices' },
        { ul: [
          '**EEA, UK, and Switzerland:** we ask for your consent through a Google-certified consent message before advertising cookies are used. If you decline, you may still see non-personalised ads, which use only limited data such as your approximate location and the page you are viewing.',
          '**Change or withdraw ad consent:** to revisit the choice you made in the consent message, clear the cookies for this site in your browser settings - the consent message will appear again on your next visit and you can make a new choice (including withdrawing consent entirely).',
          "**Personalised ads:** you can turn off personalised advertising at any time in [Google Ads Settings](https://adssettings.google.com), or opt out of third-party vendors' use of cookies at [aboutads.info](https://www.aboutads.info/choices) and (in Europe) [youronlinechoices.eu](https://www.youronlinechoices.eu).",
          '**Browser controls:** you can block or delete cookies in your browser settings. Blocking strictly necessary cookies will stop you signing in.',
          '**US state privacy laws:** we do not sell personal data for money. Where ad cookies count as "sharing" for targeted advertising under laws such as the CCPA/CPRA, you can opt out using the Google Ads Settings link above or a browser signal such as Global Privacy Control.',
        ] },
      ],
    },
    {
      id: 'retention-security',
      title: '7. Data Retention & Security',
      blocks: [
        { p: 'We keep your personal data only for as long as your account is active or as needed to provide our services. Security and activity logs are retained for a limited period for audit purposes. When you delete your account, your personal data is removed or anonymised, except where we must retain limited records for legal or fraud-prevention reasons.' },
        { p: 'We protect your data with encryption in transit (HTTPS/TLS), hashed passwords, role-based access control, rate limiting, and security headers. No method of transmission or storage is 100% secure, but we work continuously to keep your information safe.' },
      ],
    },
    {
      id: 'your-rights',
      title: '8. Your Rights',
      blocks: [
        { p: 'You have the right to:' },
        { ul: [
          '**Access and update** your data at any time from your dashboard profile page.',
          '**Withdraw consent** to emails - every email includes an unsubscribe link, and you can toggle notifications in your profile settings.',
          '**Request a copy** of the personal data we hold about you.',
          '**Request deletion** of your account and personal data, subject to legal retention requirements.',
          '**Opt out of personalised ads** at any time - see [section 6.3](#cookies-advertising).',
          '**Object to or restrict** certain processing, and to lodge a complaint with your local data-protection authority.',
        ] },
        { p: 'To exercise any of these rights, email us at [hello@thexcel360.com](mailto:hello@thexcel360.com).' },
      ],
    },
    {
      id: 'children',
      title: '9. Children’s Privacy',
      blocks: [
        { p: 'Our services are intended for users aged 16 and above. We do not knowingly collect personal data from children under 16. If you believe a child has provided us with personal data, contact us and we will delete it promptly. Our ads are not directed at children, and we do not knowingly allow personalised advertising to be shown to users under 16.' },
      ],
    },
    {
      id: 'changes',
      title: '10. Changes to This Policy',
      blocks: [
        { p: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or through a notice on the platform and update the "last updated" date above. Continued use of the platform after changes take effect constitutes acceptance of the updated policy.' },
      ],
    },
    {
      id: 'contact',
      title: '11. Contact Us',
      blocks: [
        { p: 'Questions, concerns, or requests about your privacy? Reach our team at [hello@thexcel360.com](mailto:hello@thexcel360.com) or through our [contact page](/contact).' },
      ],
    },
  ],
}

export const LEGAL = { terms: TERMS, privacy: PRIVACY } as const
export type LegalKind = keyof typeof LEGAL

/** Splits inline markup into plain, bold and link pieces (shared parser for web and app). */
export type Inline = { text: string; bold?: boolean; href?: string }
export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) })
    out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], href: m[3] })
    last = re.lastIndex
  }
  if (last < s.length) out.push({ text: s.slice(last) })
  return out
}
