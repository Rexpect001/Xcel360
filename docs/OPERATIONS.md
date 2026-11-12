# Xcel360 production operations

## Architecture and cost controls

- Public detail pages use on-demand static generation with a one-hour revalidation window. Authenticated matching runs separately through `/api/opportunities/[id]/match` and is never part of the shared page cache.
- Public settings are fetched through one cached endpoint. Changing settings through the admin API invalidates it.
- `/api/og` requires the server's `CRON_SECRET` and is used only to create permanent Blob images. New records never store a dynamic OG URL if image generation fails. The admin backfill handles at most five opportunities and five events per request.
- Launchpad and writing tools share a database-backed per-user AI allowance: 15 runs per hour and 40 per rolling day. The usage ledger lives in `ActivityLog`; model and token counts are saved on completed runs.

## Checks after a deployment

1. Run `npm run build` before deploying.
2. Check `/`, `/api/settings/public`, and a public detail page. An anonymous request to `/api/og` should return 403.
3. Run `npm run db:check` from a trusted environment with production credentials. It reports counts and lock health, not connection secrets.
4. Review Azure Container Apps metrics and Azure Logic Apps run history over the next 24–48 hours. Confirm both scheduled workflows succeed and inspect any backend errors.
5. If compute usage is high, inspect image rendering, cron jobs, and automated traffic before changing plans.

## Database safety

- The app currently uses Supabase Postgres via Prisma. Keep `DATABASE_URL` restricted to server-side environments and use `DIRECT_URL` for schema work. The current connection is limited to one Prisma connection per function instance. Verify pooler mode against Supabase's current connection guidance before changing it.
- Do not run `prisma db push` directly against production without a reviewed schema diff and a restorable backup. This repository does not yet have a migration history; establish one before the next schema change.
- Check the Supabase Dashboard's Database > Backups page. Paid plans have automatic daily backups; free projects require regular off-site exports. Confirm the actual plan and test a restore to a disposable database. Neither backup policy nor restore testing can be inferred from application credentials.
- The dynamic OG cleanup was backed up to `.tmp/dynamic-og-backup-2026-10-06T00-07-21-944Z.json` before 2,791 `Opportunity.imageUrl` values were cleared. `.tmp` is gitignored. Copy this file to secure off-site storage. `node scripts/restore-dynamic-og.mjs --file=PATH` previews a restoration; add `--apply` to restore only currently empty image fields. Do not restore unless rolling back the renderer policy.

## Next architecture decisions

- Keep cached pages and lightweight user APIs in Azure Container Apps. Move image creation, discovery, bulk email, and import jobs to a queue/worker only if they become material in backend metrics.
- Decide on a backup retention target and restore-time objective before adding more user data. Establish versioned Prisma migrations and a staging database before changing tables.
- Launchpad currently provides idea validation, interview questions, and a 30-day plan. Saving startup projects, collaboration, and paid usage tiers need separate product and data-model decisions; they are not implied by renaming the old Pro section.

## Student workflow

- `/dashboard/saved` is the opportunity pipeline. Saving creates a shortlist item; Start preparing creates an `Application` and a checklist based on that opportunity's required documents (or the default checklist when none are supplied). Students move it through submitted, interview, and result themselves. No application is submitted to a provider automatically.
- The academic CV builder uses a structured intake distilled from reviewed CV feedback and published CV guidance. It asks for the target criteria, education, research methods and findings, relevant experience and outcomes, and supporting evidence. Private example CVs are not sent to the AI service. Form drafts live in browser session storage; generated text is not stored in the database.
- Public mentorship and mentor-application links temporarily redirect to `/resources`, and navigation and sitemap links are removed. Admin records remain available for a future relaunch.
