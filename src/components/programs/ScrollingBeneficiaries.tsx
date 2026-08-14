'use client'
import { useEffect, useRef } from 'react'

interface Beneficiary {
  id: string
  firstName: string
  department: string | null
  school: string | null
}

interface Props {
  beneficiaries: Beneficiary[]
}

function maskName(firstName: string) {
  // Show first name + long dashes  -  never reveals full identity
  return `${firstName} ${' - '.repeat(4)}`
}

function BeneficiaryCard({ b }: { b: Beneficiary }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 w-full select-none">
      {/* Avatar circle with initials */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-brand-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">{firstName(b.firstName)}</span>
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 text-sm">{maskName(b.firstName)}</div>
        <div className="text-xs text-gray-400 truncate mt-0.5">
          {[b.department, b.school].filter(Boolean).join(' · ') || 'Xcel360 Cohort'}
        </div>
      </div>
      <div className="ml-auto flex-shrink-0">
        <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">Beneficiary</span>
      </div>
    </div>
  )
}

function firstName(name: string) {
  return name.charAt(0).toUpperCase()
}

export default function ScrollingBeneficiaries({ beneficiaries }: Props) {
  const col1Ref = useRef<HTMLDivElement>(null)
  const col2Ref = useRef<HTMLDivElement>(null)

  // Split beneficiaries into two columns for a richer layout
  const mid = Math.ceil(beneficiaries.length / 2)
  const col1 = beneficiaries.slice(0, mid)
  const col2 = beneficiaries.slice(mid)

  // Duplicate lists so the scroll loops seamlessly
  const list1 = [...col1, ...col1]
  const list2 = [...col2, ...col2]

  return (
    <div className="relative">
      {/* Fade overlays top and bottom */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />

      <div className="overflow-hidden h-[480px]">
        <div className="grid md:grid-cols-2 gap-4 h-full">
          {/* Column 1  -  scrolls up */}
          <div className="overflow-hidden">
            <div
              ref={col1Ref}
              className="flex flex-col gap-3 animate-scroll-up"
              style={{ animationDuration: `${Math.max(20, col1.length * 2.5)}s` }}
            >
              {list1.map((b, i) => (
                <BeneficiaryCard key={`${b.id}-${i}`} b={b} />
              ))}
            </div>
          </div>

          {/* Column 2  -  scrolls up (offset delay so they don't sync) */}
          {col2.length > 0 && (
            <div className="overflow-hidden hidden md:block">
              <div
                ref={col2Ref}
                className="flex flex-col gap-3 animate-scroll-up"
                style={{
                  animationDuration: `${Math.max(20, col2.length * 2.5)}s`,
                  animationDelay: '-8s',
                }}
              >
                {list2.map((b, i) => (
                  <BeneficiaryCard key={`${b.id}-${i}`} b={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Names are partially hidden to protect beneficiary privacy.
      </p>
    </div>
  )
}
