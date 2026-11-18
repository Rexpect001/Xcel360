import type { ReactNode } from 'react'

// Renders opportunity text (description / eligibility) the same way everywhere:
// "## " / "### " section headers, "• " / "- " / "* " bullets, inline **bold**.
// Used by the public detail page and the live preview on /post.

function renderInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-ink-900">{part}</strong>
      : part
  )
}

function isHeader(line: string): boolean {
  return line.startsWith('### ') || line.startsWith('## ')
}

function headerText(line: string): string {
  return line.replace(/^#{1,3}\s*/, '').replace(/:$/, '').trim()
}

export default function RichDescription({ text, compact = false }: { text: string; compact?: boolean }) {
  const size = compact ? 'text-sm' : 'text-[15px]'
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = (key: string) => {
    if (!bullets.length) return
    nodes.push(
      <ul key={key} className="space-y-1.5 my-2 pl-1">
        {bullets.map((item, i) => (
          <li key={i} className={`flex items-start gap-2.5 ${size} leading-relaxed text-ink-700`}>
            <span className={`${compact ? 'mt-2' : 'mt-2.5'} h-1.5 w-1.5 rounded-full bg-accent-500 flex-shrink-0`} />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
    bullets = []
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) { flushBullets(`ul-${idx}`); return }

    const bulletText = trimmed.startsWith('- ') || trimmed.startsWith('* ')
      ? trimmed.slice(2).trim()
      : trimmed.charCodeAt(0) === 8226
        ? trimmed.slice(1).trim()
        : null
    if (bulletText) {
      bullets.push(bulletText)
      return
    }

    flushBullets(`ul-${idx}`)

    if (isHeader(trimmed)) {
      nodes.push(
        <h3 key={`h-${idx}`} className={`font-bold text-ink-900 ${compact ? 'text-sm mt-4' : 'text-base mt-5'} mb-1.5`}>
          {headerText(trimmed)}
        </h3>
      )
    } else {
      nodes.push(
        <p key={`p-${idx}`} className={`text-ink-700 ${size} leading-relaxed`}>
          {renderInline(trimmed)}
        </p>
      )
    }
  })
  flushBullets('ul-end')

  return <div className="space-y-2 max-w-[68ch]">{nodes}</div>
}
