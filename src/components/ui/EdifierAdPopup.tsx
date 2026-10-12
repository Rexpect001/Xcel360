'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, ClipboardList, Star } from 'lucide-react'

const STORAGE_KEY = 'edifier_ad_last_shown'

function shouldShow(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_KEY)
    if (!last) return true
    const lastDate = new Date(last).toDateString()
    const today = new Date().toDateString()
    return lastDate !== today
  } catch {
    return true
  }
}

function markShown() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  } catch {}
}

export default function EdifierAdPopup({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled || !shouldShow()) return
    const timer = setTimeout(() => {
      setVisible(true)
      markShown()
    }, 1800)
    return () => clearTimeout(timer)
  }, [enabled])

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-fadeIn"
        onClick={() => setVisible(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="EDIFIER announcement"
        className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto animate-slideUp"
      >
        <div className="rounded-xl overflow-hidden shadow-2xl">

          {/* Header band */}
          <div
            className="relative px-6 pt-7 pb-5 text-white"
            style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2E75B6 60%, #145228 100%)' }}
          >
            <button
              onClick={() => setVisible(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Logo mark */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="white" strokeWidth="1.2"/>
                  <text x="16" y="14" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700"
                    fontSize="7" fill="white">Xcel</text>
                  <text x="16" y="22" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700"
                    fontSize="6.5" fill="rgba(255,255,255,0.85)">360°</text>
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/70">Xcel360 Presents</p>
                <p className="text-lg font-bold tracking-wide leading-tight">EDIFIER 2026</p>
              </div>
            </div>

            <p className="text-sm text-white/80 leading-relaxed">
              Scientific Poster Presentation &amp; Judging Competition  -  now open for student submissions and judge volunteers.
            </p>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-5">
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <ClipboardList size={14} className="text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Submit Your Poster</p>
                  <p className="text-xs text-gray-500">Upload your scientific research poster and get it scored by expert judges.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Star size={14} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Volunteer as a Judge</p>
                  <p className="text-xs text-gray-500">Academics and professionals  -  apply to review and score poster presentations.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href="https://edifier.thexcel360.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white py-2.5 rounded-lg transition-colors"
                style={{ background: 'linear-gradient(135deg,#1F4E79,#2E75B6)' }}
                onClick={() => setVisible(false)}
              >
                <ExternalLink size={13} />
                Join as Student
              </a>
              <a
                href="https://edifier.thexcel360.com/volunteer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white py-2.5 rounded-lg transition-colors"
                style={{ background: 'linear-gradient(135deg,#145228,#217346)' }}
                onClick={() => setVisible(false)}
              >
                <Star size={13} />
                Volunteer to Judge
              </a>
            </div>

            <button
              onClick={() => setVisible(false)}
              className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Maybe later
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(calc(-50% + 24px)); }
          to   { opacity: 1; transform: translateY(-50%); }
        }
        .animate-fadeIn  { animation: fadeIn  0.2s ease both; }
        .animate-slideUp { animation: slideUp 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
    </>
  )
}
