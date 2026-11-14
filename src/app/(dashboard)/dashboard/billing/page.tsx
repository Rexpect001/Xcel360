import { format } from 'date-fns'
import { CheckCircle2, Clock, Lock, ShieldCheck, Sparkles, Wand2, XCircle } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import BuyCreditsButton from '@/components/dashboard/BuyCreditsButton'
import InviteCard from '@/components/dashboard/InviteCard'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CREDIT_PACKS, CREDITS_PER_USE, FREE_CREDITS, formatNaira, pricePerUse, purchaseCredits, savingsPercent, usesFor } from '@/lib/billing'
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
  const uses = usesFor(balance)
  const meter = Math.min(100, Math.round((balance / Math.max(FREE_CREDITS, balance)) * 100))

  return (
    <div>
      <DashHeader
        eyebrow="Account"
        title="Credits"
        subtitle={`Credits pay for new AI drafts across the writing tools and Launchpad. Each new draft uses ${CREDITS_PER_USE} credits.`}
      />

      {result && <PaymentResult result={result} />}

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-6 text-white shadow-soft">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <p className="text-sm font-medium text-brand-100">Your balance</p>
          {unlimited ? (
            <p className="mt-1 font-display text-4xl">Unlimited</p>
          ) : (
            <>
              <p className="mt-1 font-display text-5xl tabular-nums">{balance.toLocaleString()}<span className="ml-2 text-lg font-sans font-medium text-brand-100">credits</span></p>
              <p className="mt-2 text-sm text-white">
                Enough for <span className="font-semibold text-accent-200">{uses} new draft{uses === 1 ? '' : 's'}</span>
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15" role="meter" aria-label="Credit balance" aria-valuemin={0} aria-valuemax={Math.max(FREE_CREDITS, balance)} aria-valuenow={balance}>
                <div className="h-full rounded-full bg-accent-300" style={{ width: `${meter}%` }} />
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-brand-100">Every account starts with {FREE_CREDITS} free credits ({usesFor(FREE_CREDITS)} drafts). Credits never expire.</p>
        </div>

        <ol className="paper-card grid gap-4 p-6 text-sm">
          {[
            { icon: Sparkles, title: `${CREDITS_PER_USE} credits per new draft`, body: 'CV, SOP, cover letter, cold email and every Launchpad tool cost the same.' },
            { icon: Wand2, title: 'Edits are free', body: 'Fixing flagged issues, editing and restoring earlier versions never use credits.' },
            { icon: ShieldCheck, title: 'Failed drafts are refunded', body: 'If a draft fails, the credits go straight back to your balance.' },
          ].map((s) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><s.icon className="h-4 w-4" /></span>
              <div>
                <p className="font-semibold text-ink-900">{s.title}</p>
                <p className="text-ink-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <InviteCard className="mb-8" />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-bold text-lg text-ink-900">Buy credits</h2>
        <p className="text-xs text-ink-500">Bigger packs cost less per draft.</p>
      </div>
      {!payable && (
        <p className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">Payments are being set up. Check back soon.</p>
      )}
      <div className="grid md:grid-cols-3 gap-4 mb-3">
        <div className="paper-card relative p-6 flex flex-col bg-surface-50">
          <div className="mb-3 flex min-h-[22px] items-center">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-700 bg-white border border-surface-200 px-2 py-0.5 rounded">Included</span>
          </div>
          <h3 className="font-bold text-lg text-ink-900">Free</h3>
          <p className="font-display text-4xl text-ink-900 mt-2">{formatNaira(0)}</p>
          <p className="mt-1 text-sm text-ink-700">
            <span className="font-semibold">{FREE_CREDITS} credits</span> · {usesFor(FREE_CREDITS)} drafts
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink-600">Once, on every account</p>
          <p className="text-sm text-ink-600 mt-3 flex-1">Try every writing and Launchpad tool before you pay anything.</p>
          <p className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-6 py-3 text-sm font-semibold text-ink-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Already in your account
          </p>
        </div>
        {CREDIT_PACKS.map((p) => {
          const save = savingsPercent(p)
          return (
            <div
              key={p.id}
              className={cn(
                'paper-card relative p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                p.featured && 'border-brand-500 ring-2 ring-brand-500/20'
              )}
            >
              <div className="mb-3 flex min-h-[22px] items-center gap-2">
                {p.featured && <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-brand-600 px-2 py-0.5 rounded">Best value</span>}
                {save > 0 && <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Save {save}%</span>}
              </div>
              <h3 className="font-bold text-lg text-ink-900">{p.name}</h3>
              <p className="font-display text-4xl text-ink-900 mt-2">{formatNaira(p.priceNaira)}</p>
              <p className="mt-1 text-sm text-ink-700">
                <span className="font-semibold">{p.credits} credits</span> · {usesFor(p.credits)} drafts
              </p>
              <p className="mt-0.5 text-sm font-semibold text-brand-700">{formatNaira(pricePerUse(p))} per draft</p>
              <p className="text-sm text-ink-600 mt-3 flex-1">{p.blurb}</p>
              <div className="mt-5">
                {payable ? <BuyCreditsButton packId={p.id} label={`Buy ${p.credits} credits`} featured={p.featured} /> : null}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-ink-500 mb-8 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure payment by Paystack: card, bank transfer or USSD. Xcel360 never sees your card details.</p>

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
