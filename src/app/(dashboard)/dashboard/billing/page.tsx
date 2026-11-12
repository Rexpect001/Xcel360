import { format } from 'date-fns'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import BuyCreditsButton from '@/components/dashboard/BuyCreditsButton'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CREDIT_PACKS, FREE_CREDITS, formatNaira } from '@/lib/billing'
import { creditHistory, getBalance, hasUnlimitedCredits } from '@/lib/credits'
import { fulfilPayment, paystackConfigured, type FulfilResult } from '@/lib/paystack'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const REASON_LABEL: Record<string, string> = {
  FREE_GRANT: 'Welcome credits',
  PURCHASE: 'Credits bought',
  DRAFT: 'Draft generated',
  REFUND: 'Refund (draft failed)',
  ADMIN: 'Adjustment',
}

export default async function BillingPage({ searchParams }: { searchParams: { reference?: string } }) {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return null

  // Returning from Paystack: confirm this user's payment before showing the balance
  let result: FulfilResult | null = null
  if (searchParams.reference) {
    const own = await prisma.payment.findFirst({ where: { reference: searchParams.reference, userId }, select: { id: true } })
    result = own ? await fulfilPayment(searchParams.reference).catch(() => 'pending' as const) : 'unknown'
  }

  const unlimited = hasUnlimitedCredits(session.user.role)
  const [balance, history, payments] = await Promise.all([
    getBalance(userId),
    creditHistory(userId),
    prisma.payment.findMany({
      where: { userId, status: { not: 'PENDING' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, reference: true, credits: true, amount: true, status: true, createdAt: true },
    }),
  ])
  const payable = paystackConfigured()

  return (
    <div>
      <DashHeader
        eyebrow="Account"
        title="Credits"
        subtitle="Credits pay for new AI drafts across the writing tools and Launchpad. One credit is one new draft. Editing, fixing issues and restoring versions are free."
      />

      {result && <PaymentResult result={result} />}

      <section className="paper-card p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-500">Your balance</p>
          <p className="font-display text-4xl text-ink-900 mt-1">
            {unlimited ? 'Unlimited' : `${balance} credit${balance === 1 ? '' : 's'}`}
          </p>
          <p className="text-xs text-ink-400 mt-1">Every account starts with {FREE_CREDITS} free credits. Credits do not expire.</p>
        </div>
      </section>

      <h2 className="font-bold text-ink-900 mb-3">Buy credits</h2>
      {!payable && (
        <p className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">Payments are being set up. Check back soon.</p>
      )}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {CREDIT_PACKS.map((p) => (
          <div key={p.id} className={cn('paper-card p-6 flex flex-col', p.featured && 'border-brand-300 ring-1 ring-brand-200')}>
            {p.featured && <span className="self-start mb-2 text-[11px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 px-2 py-0.5 rounded">Best value</span>}
            <h3 className="font-bold text-lg text-ink-900">{p.name}</h3>
            <p className="font-display text-3xl text-ink-900 mt-2">{formatNaira(p.priceNaira)}</p>
            <p className="text-sm text-ink-600 mt-1">
              {p.credits} credits · {formatNaira(Math.round(p.priceNaira / p.credits))} per draft
            </p>
            <p className="text-xs text-ink-500 mt-3 flex-1">{p.blurb}</p>
            <div className="mt-5">
              {payable ? <BuyCreditsButton packId={p.id} label={`Buy ${p.credits} credits`} featured={p.featured} /> : null}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-400 -mt-5 mb-8">Secure payment by Paystack: card, bank transfer or USSD. Xcel360 never sees your card details.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="paper-card p-5">
          <h2 className="font-bold text-ink-900 mb-3">Credit history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-ink-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-surface-100 text-sm">
              {history.map((h) => (
                <li key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink-800 truncate">{REASON_LABEL[h.reason] ?? h.reason}{h.note && h.reason === 'DRAFT' ? `: ${h.note}` : ''}</p>
                    <p className="text-xs text-ink-400">{format(h.createdAt, 'd MMM yyyy, HH:mm')}</p>
                  </div>
                  <span className={cn('font-semibold tabular-nums', h.delta > 0 ? 'text-emerald-700' : 'text-ink-600')}>
                    {h.delta > 0 ? `+${h.delta}` : h.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="paper-card p-5">
          <h2 className="font-bold text-ink-900 mb-3">Payments</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-ink-500">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-surface-100 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink-800">{p.credits} credits · {formatNaira(p.amount / 100)}</p>
                    <p className="text-xs text-ink-400 truncate">{format(p.createdAt, 'd MMM yyyy')} · Ref {p.reference}</p>
                  </div>
                  <span className={cn('text-xs font-semibold', p.status === 'SUCCESS' ? 'text-emerald-700' : 'text-red-600')}>
                    {p.status === 'SUCCESS' ? 'Paid' : 'Failed'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function PaymentResult({ result }: { result: FulfilResult }) {
  const map = {
    credited: { icon: CheckCircle2, tone: 'border-emerald-200 bg-emerald-50 text-emerald-800', text: 'Payment received. Your credits have been added.' },
    already: { icon: CheckCircle2, tone: 'border-emerald-200 bg-emerald-50 text-emerald-800', text: 'Payment received. Your credits are in your balance.' },
    pending: { icon: Clock, tone: 'border-amber-200 bg-amber-50 text-amber-800', text: 'We are still confirming your payment with Paystack. Your credits will appear within a few minutes; refresh this page.' },
    failed: { icon: XCircle, tone: 'border-red-200 bg-red-50 text-red-800', text: 'Paystack reported this payment as unsuccessful, so no credits were added. If money left your account, contact us with the reference below.' },
    unknown: { icon: XCircle, tone: 'border-red-200 bg-red-50 text-red-800', text: 'We could not find that payment on your account.' },
  }[result]
  const Icon = map.icon
  return (
    <div className={cn('mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm', map.tone)}>
      <Icon className="h-5 w-5 shrink-0" /> {map.text}
    </div>
  )
}
