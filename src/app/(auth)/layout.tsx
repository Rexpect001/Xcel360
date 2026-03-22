'use client'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

// Floating bubble config
const BUBBLES = [
  { size: 80,  left: '8%',  delay: 0,   duration: 7  },
  { size: 50,  left: '18%', delay: 1.5, duration: 9  },
  { size: 120, left: '32%', delay: 0.8, duration: 11 },
  { size: 40,  left: '48%', delay: 2.2, duration: 8  },
  { size: 90,  left: '62%', delay: 0.3, duration: 10 },
  { size: 60,  left: '75%', delay: 1.8, duration: 7.5},
  { size: 110, left: '88%', delay: 0.6, duration: 12 },
  { size: 35,  left: '25%', delay: 3,   duration: 9  },
  { size: 70,  left: '55%', delay: 1.2, duration: 8.5},
  { size: 45,  left: '92%', delay: 2.5, duration: 7  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated bubbles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-full opacity-0"
            style={{
              width: b.size,
              height: b.size,
              left: b.left,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(2px)',
              animation: `floatBubble ${b.duration}s ease-in ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs in background */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
      <div className="absolute top-3/4 left-1/3 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

      <style>{`
        @keyframes floatBubble {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(0.8); opacity: 0; }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Xcel<span className="text-brand-300">360</span>
            </span>
            <p className="text-brand-300/80 text-sm font-medium -mt-1">Your scholarship journey starts here</p>
          </Link>
        </div>

        {/* Card with glassmorphism */}
        <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          {children}
        </div>

        <p className="text-center text-brand-300/60 text-xs mt-6">
          © {new Date().getFullYear()} Xcel360. All rights reserved.
        </p>
      </div>
    </div>
  )
}
