import { format } from 'date-fns'
import { CheckCircle2, Clock, Lock, Plus, Wand2, XCircle } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import BuyCreditsButton from '@/components/dashboard/BuyCreditsButton'
import InviteCard from '@/components/dashboard/InviteCard'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CREDIT_PACKS, FREE_CREDITS, formatNaira, purchaseCredits } from '@/lib/billing'
import { creditHistory, getBalance, hasUnlimitedCredits } from '@/lib/credits'
import { fulfilPayment, paystackConfigured, type FulfilResult } from '@/lib/paystack'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const REASON_LABEL: Record<string, string> = {
  FREE_GRANT: 'Welcome credits',
  PURCHASE: 'Credits bought',
  DRAFT: 'Draft generated',
  REFUND: 'Refund (draft failed)',
  ADMIN: 'Gift from Xcel360',
  REFERRAL: 'Referral reward',
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
        subtitle="Credits pay for new AI drafts across the writing tools and Launchpad."
      />

      {result && <PaymentResult result={result} />}

      <section className="mb-5 flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-6 py-5 text-white shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-100">Your balance</p>
          <p className="mt-1 font-display text-5xl leading-none tabular-nums">
            {unlimited ? 'Unlimited' : balance.toLocaleString()}
            {!unlimited && <span className="ml-2 text-lg font-sans font-medium text-brand-100">credits</span>}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-100">
            <Wand2 className="h-3.5 w-3.5" /> Edits and fixes are free. Failed drafts are refunded. Credits never expire.
          </p>
        </div>
        {!unlimited && (
          <a href="#buy" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">
            <Plus className="h-4 w-4" /> Top up
          </a>
        )}
      </section>

      <InviteCard className="mb-6" />

      <h2 id="buy" className="mb-3 scroll-mt-6 font-bold text-lg text-ink-900">Buy credits</h2>
      {!payable && (
        <p className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">Payments are being set up. Check back soon.</p>
      )}
      <div className="grid md:grid-cols-3 gap-3 mb-2">
        <div className="paper-card p-5 flex flex-col bg-surface-50">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-ink-900">Free</h3>
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-700 bg-white border border-surface-200 px-2 py-0.5 rounded">Included</span>
          </div>
          <p className="font-display text-5xl leading-tight text-ink-900 mt-1">{FREE_CREDITS} <span className="text-xl font-sans font-semibold text-ink-700">credits</span></p>
          <p className="mt-1 text-sm text-ink-700 flex-1">Once, on every account. Try every tool before you pay.</p>
          <p className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Already in your account
          </p>
        </div>
        {CREDIT_PACKS.map((p) => (
          <div
            key={p.id}
            className={cn(
              'paper-card p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
              p.featured && 'border-brand-500 ring-2 ring-brand-500/20'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-lg text-ink-900">{p.name}</h3>
              {p.featured && <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-brand-600 px-2 py-0.5 rounded">Best value</span>}
            </div>
            <p className="font-display text-5xl leading-tight text-ink-900 mt-1">{formatNaira(p.priceNaira)}</p>
            <p className="mt-1 text-base font-semibold text-brand-700">{p.credits} credits</p>
            <p className="mt-1 text-sm text-ink-700 flex-1">{p.blurb}</p>
            {payable && (
              <div className="mt-4">
                <BuyCreditsButton packId={p.id} label={`Buy ${p.credits} credits`} featured={p.featured} />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-600 mb-6 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure payment by Paystack: card, bank transfer or USSD. Xcel360 never sees your card details.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="paper-card p-5">
          <h2 className="font-bold text-ink-900 mb-2">Credit history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-ink-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-surface-100 text-sm">
              {history.map((h) => (
                <li key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink-800 truncate">{(h.reason === 'ADMIN' || h.reason === 'REFERRAL') && h.note ? h.note : REASON_LABEL[h.reason] ?? h.reason}{h.note && h.reason === 'DRAFT' ? `: ${h.note}` : ''}</p>
                    <p className="text-xs text-ink-500">{format(h.createdAt, 'd MMM yyyy, HH:mm')}</p>
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
                    <p className="text-ink-800">{purchaseCredits(p.amount, p.credits)} credits · {formatNaira(p.amount / 100)}</p>
                    <p className="text-xs text-ink-500 truncate">{format(p.createdAt, 'd MMM yyyy')} · Ref {p.reference}</p>
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
