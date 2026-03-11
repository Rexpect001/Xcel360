'use client'
import { useState } from 'react'
import { Twitter, Facebook, Linkedin, MessageCircle, Link2, Check } from 'lucide-react'

interface ShareButtonsProps {
  title: string
  url: string
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `Check out this scholarship: ${title}`
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(shareText)

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const platforms = [
    {
      name: 'X / Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      hover: 'hover:bg-gray-900 hover:text-white hover:border-gray-900',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hover: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      hover: 'hover:bg-blue-700 hover:text-white hover:border-blue-700',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      hover: 'hover:bg-green-500 hover:text-white hover:border-green-500',
    },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Share</span>
      {platforms.map((p) => {
        const Icon = p.icon
        return (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${p.name}`}
            className={`w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 transition-all duration-150 ${p.hover}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
      <button
        onClick={copyLink}
        title="Copy link"
        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150 ${
          copied
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900'
        }`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  )
}
