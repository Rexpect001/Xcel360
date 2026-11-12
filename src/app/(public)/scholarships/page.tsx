export const revalidate = 3600

import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import OpportunitiesPage from '../opportunities/page'

export const metadata: Metadata = {
  title: 'Scholarships for African Students',
  description:
    'Find fully funded scholarships, grants, fellowships, and study abroad opportunities for African students. Search by country, field, level, and deadline.',
  keywords: [
    'scholarships for African students',
    'fully funded scholarships for Africans',
    'study abroad scholarships Africa',
    'masters scholarships for Africans',
    'undergraduate scholarships for Africans',
    'PhD scholarships for Africans',
  ],
  alternates: { canonical: '/opportunities' },
  openGraph: {
    title: 'Scholarships for African Students - Xcel360',
    description: 'Search scholarships, grants, fellowships, and funding opportunities by country, field, level, and deadline.',
    url: '/scholarships',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default OpportunitiesPage
