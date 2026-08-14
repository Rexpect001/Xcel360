import { ShieldCheck, ShieldX, BadgeCheck, Calendar, User, GraduationCap, Building2 } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function fmt(d: Date | string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ' - '
}

export default async function VerifyCertificatePage({ params }: { params: { certificateId: string } }) {
  const cert = await db.certificate
    .findUnique({
      where: { certificateId: params.certificateId },
      include: { event: { select: { title: true, date: true } } },
    })
    .catch(() => null)

  const valid = cert && cert.status === 'ISSUED'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="h-7 w-7 text-brand-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{params.certificateId}</p>
        </div>

        {!cert ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <ShieldX className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Certificate Not Found</h2>
            <p className="text-gray-500 mt-2 text-sm">
              No certificate matches this ID. It may have been mistyped or is not a genuine Xcel360 certificate.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Status banner */}
            <div className={`flex items-center gap-3 px-6 py-4 ${valid ? 'bg-green-50' : 'bg-red-50'}`}>
              {valid ? <ShieldCheck className="h-6 w-6 text-green-600" /> : <ShieldX className="h-6 w-6 text-red-600" />}
              <div>
                <p className={`font-bold ${valid ? 'text-green-700' : 'text-red-700'}`}>
                  {valid ? 'Valid Certificate' : 'Certificate Revoked'}
                </p>
                <p className={`text-xs ${valid ? 'text-green-600' : 'text-red-600'}`}>
                  {valid
                    ? 'This is a genuine, currently valid Xcel360 certificate.'
                    : 'This certificate has been revoked and is no longer valid.'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <Row icon={<User className="h-4 w-4" />} label="Certificate Holder" value={cert.fullName} />
              <Row icon={<BadgeCheck className="h-4 w-4" />} label="Certificate Type" value={cert.certificateType} />
              <Row icon={<GraduationCap className="h-4 w-4" />} label="Event" value={cert.event?.title ?? ' - '} />
              <Row icon={<Calendar className="h-4 w-4" />} label="Issue Date" value={fmt(cert.issuedAt)} />
              {cert.institution && (
                <Row icon={<Building2 className="h-4 w-4" />} label="Institution" value={cert.institution} />
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/certificate" className="text-sm text-brand-700 font-semibold hover:underline">
            Access your own certificates →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  )
}
