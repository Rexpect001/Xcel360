# Performance and caching runbook

Load tests in November 2026 showed 3-60 s response times on thexcel360.com. The
cause was that every public page was rendered from scratch on every request
(`force-dynamic`, `Cache-Control: private, no-store`), and DNS was not proxied
through Cloudflare, so nothing was cached anywhere.

## What the code now does

| Layer | Behaviour |
|---|---|
| Public pages (`/`, `/opportunities`, `/scholarships`, `/jobs`, `/internships`, `/events`, `/news`, `/resources`, `/success-stories`, `/mentorship`) | ISR, `revalidate = 300`. Served from the Next cache; refreshed in the background at most every 5 minutes. |
| Detail pages (`/opportunities/[id]`, `/jobs/[id]`, `/internships/[id]`, `/events/[id]`, `/news/[slug]`, `/resources/[slug]`) | Same, rendered on first visit (nothing is prerendered at build). Database errors throw, so an error page is never cached. |
| Response header on those pages | `Cache-Control: s-maxage=300, stale-while-revalidate=60` (CDN may cache; browsers revalidate). |
| Build without a database | The image is built with no database credentials. Pages prerendered at build are empty, so `src/lib/isr.ts` gives them a 30 s cache life; the first request after 30 s replaces them with real data. The homepage stays on a 30 s cycle (a Next 14.2 quirk for `/`), which costs two small queries per server every 30 s. |
| `/api/settings/public` (called on every page view) | Database read at most once per 30 s per server, concurrent requests share one query (`src/lib/memo.ts`). |
| `/_next/static/*` | `public, max-age=31536000, immutable` (Next default, hashed file names). |
| `/brand/*`, `/downloads/*`, logos, `og-image.jpg`, `hero-image.png`, `llms.txt` | `public, max-age=86400, stale-while-revalidate=604800`. |
| Dashboard, admin, auth, API | Unchanged: dynamic and private. |

Admin writes call `revalidateOpportunityPages()` / `/api/admin/revalidate`, which
clears the cache on the server that handled the write. Other replicas pick up
the change within 5 minutes.

## Infrastructure steps (manual)

### 1. Put Cloudflare in front of the site (edge caching)

Today `thexcel360.com` (A `4.251.182.57`) and `www` are **DNS only** (grey cloud),
so Cloudflare does not cache or protect them.

1. Certificates first. Azure Container Apps managed certificates renew through
   HTTP validation, which can fail behind the Cloudflare proxy. Create a
   **Cloudflare Origin CA certificate** (SSL/TLS > Origin Server, 15 years, for
   `thexcel360.com` and `*.thexcel360.com`) and bind it to both custom domains
   in the Container App (Custom domains > Add certificate > upload PFX).
2. SSL/TLS > Overview: set the mode to **Full (strict)**.
3. DNS: switch `thexcel360.com` and `www` to **Proxied** (orange cloud).
4. Caching > Cache Rules > Create rule "Cache public HTML":
   - When: hostname equals `thexcel360.com` AND URI path does not start with
     `/api/`, `/dashboard`, `/admin`, `/signin`, `/signup`, `/auth`
   - Then: **Eligible for cache**; Edge TTL: **Use cache-control header if
     present, bypass cache if not**; Browser TTL: respect origin.
   Pages that send `private, no-store` are still never cached, so this rule is
   safe even if a path is missed.
5. Leave "Cache by device type" off, and keep query strings in the cache key
   (the default). Next's client navigation adds `?_rsc=...`, which keeps HTML
   and RSC responses apart.

### 2. Rate limiting and load shedding

Security > WAF > Rate limiting rules (the free plan allows one rule):
- Match: hostname `thexcel360.com` and path starts with `/api/`
- Rate: 100 requests per 10 s per IP, action **Block** for 10 s (returns 429).

Page traffic is served from Cloudflare's cache, so the API is what needs
protecting. Cloudflare's origin timeout is 100 s; the app's own requests to the
database use Prisma's defaults.

### 3. Container App scaling

Node runs one event loop per process, so throughput scales with replicas, not
threads. Suggested settings (check current values first):

```bash
az containerapp show -n xcel360-web -g xcel360-prod \
  --query "{cpu:properties.template.containers[0].resources.cpu, mem:properties.template.containers[0].resources.memory, scale:properties.template.scale}"

az containerapp update -n xcel360-web -g xcel360-prod \
  --cpu 1.0 --memory 2Gi \
  --min-replicas 1 --max-replicas 5 \
  --scale-rule-name http-concurrency --scale-rule-type http \
  --scale-rule-http-concurrency 80
```

`--min-replicas 1` prevents cold starts. Each replica keeps its own ISR cache,
so more replicas means a few more background refreshes, not more load per page view.

### 4. Database connection pool

Prisma opens `connection_limit` connections per replica (default
`2 x CPU + 1`). With connection_limit=1, parallel queries run one at a time
(see the latency notes from 2026-11-14). In the production `DATABASE_URL` set
`connection_limit=5&pool_timeout=10`, and make sure `replicas x 5` stays below
the database's connection cap (or use the provider's pooler).

## Verification

```bash
# Edge cache: expect cf-cache-status: HIT on the second request
curl -sI https://thexcel360.com/opportunities | grep -iE "cf-cache-status|cache-control"
curl -sI https://thexcel360.com/opportunities | grep -iE "cf-cache-status|cache-control"

# Capacity: 10,000 requests at 1,000 concurrency
npx autocannon@7.15.0 -c 1000 -a 10000 https://thexcel360.com/
```
