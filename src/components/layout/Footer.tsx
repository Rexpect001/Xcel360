import Link from 'next/link'
import { GraduationCap, Twitter, Linkedin, Instagram, Mail } from 'lucide-react'

const footerLinks = {
  Platform: [
    { label: 'Opportunities', href: '/opportunities' },
    { label: 'Mentorship', href: '/mentorship' },
    { label: 'Events', href: '/events' },
    { label: 'Resources', href: '/resources' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Success Stories', href: '/success-stories' },
    { label: 'Contact', href: '/contact' },
  ],
  Account: [
    { label: 'Create Account', href: '/signup' },
    { label: 'Sign In', href: '/signin' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Xcel<span className="text-brand-400">360</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Helping students worldwide discover scholarships, track deadlines, and access the mentorship they need to succeed.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="p-2 rounded-lg hover:bg-gray-800 transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="p-2 rounded-lg hover:bg-gray-800 transition-colors"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="p-2 rounded-lg hover:bg-gray-800 transition-colors"><Instagram className="h-4 w-4" /></a>
              <a href="mailto:hello@xcel360.com" className="p-2 rounded-lg hover:bg-gray-800 transition-colors"><Mail className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Links */}
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

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Xcel360. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
