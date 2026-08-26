# Running Xcel360 for Free (or near-free)

This guide explains how to host the entire platform on free tiers and how to
keep compute usage low. It addresses the "fluid activity CPU" overages seen on
the current host.

## The free stack

| Piece | Free service | Free limits (as of 2026) | Notes |
|---|---|---|---|
| Web app | **Vercel Hobby** | 100 GB bandwidth, generous serverless invocations | Deploy this repo; zero config |
| Database | **Neon** (or Supabase) | 0.5 GB storage, autoscaling to zero | Postgres, works with Prisma out of the box |
| File storage | **Vercel Blob** (already used) | 1 GB | Certificates, resource PDFs, uploads |
| Email | **Resend** free tier | 3,000 emails/month, 100/day | The weekly digest already batches at 100/day for this reason |
| Cron | Vercel Cron (Hobby) | **2 jobs**, once per day each | Already consolidated: `/api/cron/daily` + `/api/cron/auto-discover` |
| DNS | Cloudflare free | — | Optional, adds free CDN + caching |

## Why the CPU bill was climbing

1. **Fluid compute** — Vercel's Fluid mode bills for actual CPU time. With
   certificate PDF generation (pdf-lib) and the AI auto-discover job, CPU
   minutes add up fast. On Hobby there is no Fluid billing — functions are
   capped at 60s and that's the ceiling.
2. **Four separate cron jobs** — Hobby only allows 2. The repo now consolidates
   the three fast jobs into `/api/cron/daily`.
3. **Cold-start heavy pages** — `xlsx` and `recharts` were bundled into admin
   pages. They are now lazy-loaded, so admins only download them when actually
   importing/exporting or viewing the growth chart.

## Deployment checklist

1. **Database (Neon)**
   - Create a free project at neon.tech → copy the pooled connection string.
   - Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in Vercel env vars.
   - Run once locally: `DATABASE_URL=... npx prisma db push`

2. **Vercel**
   - Import the repo → framework preset "Next.js" (auto-detected).
   - Set env vars from `.env.example` plus `RESEND_API_KEY` and `CRON_SECRET`.
   - `CRON_SECRET`: any long random string. Vercel sends it automatically as
     `Authorization: Bearer <CRON_SECRET>` to the cron routes.
   - If prompted about Fluid compute, leave it **off** — standard serverless
     functions are what keeps this free.

3. **Email (Resend)**
   - Verify `thexcel360.com` in Resend (SPF/DKIM records) so alerts land in
     inboxes, not spam.
   - Watch the 100/day cap: the digest + match alerts are batched to respect
     it. If the user base grows past ~3,000 active email recipients/month,
     either trim digest frequency or upgrade Resend ($20/mo).

4. **Post-deploy smoke test**
   - `/privacy`, `/terms` load (linked in footer).
   - Sign up → complete profile (new education fields) → dashboard shows
     match percentages.
   - Admin → Site Settings → enable the announcement bar → appears on public
     pages within ~60s.
   - Trigger `/api/cron/daily` manually with the bearer header to confirm
     emails send.

## Keeping it free long-term

- **Images**: serve through `next/image` (AVIF/WebP enabled in
  `next.config.mjs`) — cuts bandwidth, the main free-tier limit.
- **Storage**: resources and certificates live in Vercel Blob (1 GB free).
  Periodically purge revoked certificates' PDFs if storage nears the cap.
- **Bandwidth**: put Cloudflare in front (free) and enable caching for
  `/downloads/*` and static assets if bandwidth ever approaches 100 GB.
- **Auto-discover**: the AI discovery job calls Anthropic + Serper. It is the
  only part of the platform with metered third-party cost — disable the cron
  in `vercel.json` if you want a strictly $0/month operation and post
  opportunities manually from the admin panel.

## Alternatives if Vercel Hobby no longer fits

| Option | Free tier | Caveat |
|---|---|---|
| **Railway / Render** | Limited free hours | Sleeps on idle → slow first load |
| **Cloudflare Pages + Workers** | Very generous | Needs code changes (no Node runtime by default) |
| **Self-host (Hetzner ~$4/mo)** | Not free, but flat | You manage updates, TLS, backups |

For this stack (Next.js + Prisma + cron), **Vercel Hobby + Neon + Resend** is
the lowest-friction $0/month combination.
