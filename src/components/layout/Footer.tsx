import Link from 'next/link'
import { Mail, Youtube, MessageCircle } from 'lucide-react'
import Logo from '@/components/brand/Logo'

const footerLinks = {
  Opportunities: [
    { label: 'Scholarships', href: '/opportunities' },
    { label: 'Internships', href: '/internships' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'How to search', href: '/how-to-search' },
  ],
  Platform: [
    { label: 'Resources', href: '/resources' },
    { label: 'Events & Programs', href: '/events' },
    { label: 'News', href: '/news' },
    { label: 'Mentorship', href: '/mentorship' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Success stories', href: '/success-stories' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms of service', href: '/terms' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <Link href="/" aria-label="Xcel360 home">
              <Logo tone="light" />
            </Link>
            <p className="mt-5 text-sm leading-relaxed max-w-xs text-brand-100">
              Verified scholarships, honest deadlines and the tools to write a winning application. Built for ambitious African students.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <a href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp channel" className="p-2 rounded-lg border border-white/15 hover:border-white/40 hover:text-white transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="https://www.youtube.com/@Xcel_360" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 rounded-lg border border-white/15 hover:border-white/40 hover:text-white transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="mailto:hello@thexcel360.com" aria-label="Email" className="p-2 rounded-lg border border-white/15 hover:border-white/40 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-200">
          <p>© {new Date().getFullYear()} Xcel360. All rights reserved.</p>
          <p>Always apply through the official provider&apos;s website. Xcel360 never charges application fees.</p>
        </div>
      </div>
    </footer>
  )
}
