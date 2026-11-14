# Xcel360 promo videos

Motion-graphics videos of the dashboard, built with [Remotion](https://remotion.dev) in the
web app's colours and fonts. Every scene is code, so the videos can be re-rendered whenever the
product changes.

| Composition   | Size      | Length | Use for                                  |
|---------------|-----------|--------|------------------------------------------|
| `JourneyWide` | 1920x1080 | ~53 s  | YouTube, X/Twitter, website              |
| `JourneyTall` | 1080x1920 | ~53 s  | TikTok, WhatsApp Status, Reels, Shorts   |
| `AIToolsWide` | 1920x1080 | ~47 s  | YouTube, X/Twitter, website              |
| `AIToolsTall` | 1080x1920 | ~47 s  | TikTok, WhatsApp Status, Reels, Shorts   |

**"What's new" series (Nov 2026)** — each in `…Wide` (1920x1080) and `…Tall` (1080x1920):

| Composition      | Length | Story                                                            | Source             |
|------------------|--------|------------------------------------------------------------------|--------------------|
| `Platform`       | ~21 s  | What you can do on the website                                   | `src/platform.tsx` |
| `SmartAI`        | ~21 s  | AI matching, tailoring to a listing, quality checks, credits     | `src/smartai.tsx`  |
| `Tracker`        | ~21 s  | Dashboard, pipeline, document checklist, deadlines               | `src/tracker.tsx`  |
| `Mentorship`     | ~19 s  | Free membership, cohorts, advisors, events, certificates         | `src/mentorship.tsx` |
| `WritingSuite`   | ~20 s  | Academic vs Job CV, SOP/letters/emails, drafts + Trash, Launchpad | `src/writing.tsx`  |

Shared pieces for the series (browser frame, listing card, stat strip, credit meter, outro) live in
`src/kit.tsx`. All applicants, listings and names on screen are illustrative samples.

**Nov 2026 changes (all videos):** no burned-in captions (the motion tells the story), everything
plays 1.4x faster (`SPEED` in `src/time.ts`), and the artwork is scaled up to fill each frame.
Formats: `…Wide` 1920x1080, `…Tall` 1080x1920, `…Square` 1080x1080 (Instagram/Facebook feed,
LinkedIn, X). GIFs: `node render-all.mjs --gif <Name>Square` writes a 540x540, 10 fps loop to
`out/gif/`. The Journey and AITools MP4s in `out/` predate these changes until re-rendered.

## Commands

```bash
cd video
npm install
npm run studio                 # preview and scrub in the browser
node render-all.mjs            # render all four to out/*.mp4
node render-all.mjs JourneyTall
node render-all.mjs --stills   # one review frame per scene in out/stills
```

## Adding a voiceover or music

Drop files into `video/public/` and re-render. They are picked up automatically:

- `voiceover-journey.mp3` — read the Journey script below
- `voiceover-aitools.mp3` — read the AI tools script below
- `music.mp3` — optional background bed; it is ducked under the voiceover

Record each line in the time shown (about 150 words a minute). If a line runs long, change that
scene's `dur` in `src/journey.tsx` or `src/aitools.tsx`; the script text there is also the caption.

## Voiceover script: "Your scholarship journey"

| # | Time  | Line |
|---|-------|------|
| 1 | 0:00  | Scholarships can change your life. But keeping up with all the information can be exhausting. |
| 2 | 0:06  | Xcel360 brings your whole scholarship journey into one place, with guidance at every step. |
| 3 | 0:12  | Create your account and fill in your profile: your level, your field, and the countries you're aiming for. |
| 4 | 0:18  | Your dashboard then shows the scholarships that match your profile. |
| 5 | 0:23  | Save the ones that interest you. |
| 6 | 0:27  | Then track each one from Saved to Preparing, Submitted, Interview, and Result. |
| 7 | 0:34  | Before a deadline closes, a reminder lands in your email. |
| 8 | 0:39  | Need a CV, a statement of purpose, or a cold email? The tools are right there too. |
| 9 | 0:45  | Enjoying the benefits? Share Xcel360 with your friends and family, so they can explore these opportunities too. |

## Voiceover script: "Write it with AI"

| # | Time  | Line |
|---|-------|------|
| 1 | 0:00  | A strong application needs strong documents. That's where many applicants get stuck. |
| 2 | 0:06  | Answer a few focused questions, and the CV Builder turns your own experience into a clean, standard CV, ready for a scholarship panel. |
| 3 | 0:16  | The SOP Generator helps you draft a statement of purpose that sounds like you, not a template. |
| 4 | 0:23  | Cover letters, matched to each role or programme. |
| 5 | 0:28  | And short, respectful cold emails to potential supervisors. |
| 6 | 0:34  | We've put the structure in place, so you can focus on telling your story. |
| 7 | 0:39  | Enjoying the benefits? Share Xcel360 with your friends and family, so they can explore these opportunities too. |

All names in the videos (Ada Okafor, Dr. Amina Bello, Prof. Kofi Mensah) are fictional sample
data. Scholarship names are real public programmes shown as examples of matches.

---

# "What's new" series — voiceover scripts

Optional. The videos are now ~20 s and caption-free, so these lines are written for the earlier
~40 s cut; for a voiceover, read them briskly or trim them, record to `video/public/` under the
file name shown, then re-render. Timings below are from the earlier cut.

## 1. Platform — `voiceover-platform.mp3` (~43 s)

| Time  | Line |
|-------|------|
| 0:00  | Xcel360 brings scholarships, jobs and mentorship together in one place. |
| 0:05  | Search by field, level, country and funding, and see what is open right now. |
| 0:12  | Every listing shows who can apply, the documents you need and the deadline. Save it or share it in one tap. |
| 0:19  | There is more: jobs, internships, events, guides, templates and mentorship. |
| 0:25  | Join the Friday digest and new scholarships come straight to your inbox. |
| 0:31  | Create a free account to unlock your dashboard, your tracker and the AI writing tools. |
| 0:38  | Start your search today at thexcel360.com. |

## 2. SmartAI — `voiceover-smartai.mp3` (~46 s)

| Time  | Line |
|-------|------|
| 0:00  | Our AI starts from what each scholarship actually asks for. |
| 0:05  | Fill in your profile, and we rank open scholarships by how well they fit you. |
| 0:12  | Found one you like? Tailor your CV, SOP or cover letter to it in one click. The requirements fill in for you. |
| 0:20  | Every draft is checked. We flag made-up numbers, clichés and formatting slips, and fixing them is free. |
| 0:28  | You start with 100 free credits. Each new draft uses 20, so your first five drafts are on us. |
| 0:35  | Share your invite link. When a friend joins, you both get 50 extra credits. |
| 0:41  | Try it free at thexcel360.com. |

## 3. Tracker — `voiceover-tracker.mp3` (~39 s)

| Time  | Line |
|-------|------|
| 0:00  | Your Xcel360 dashboard turns a pile of tabs into one clear plan. |
| 0:05  | See your saved items and next deadlines at a glance, with your top 12 matched scholarships right below. |
| 0:12  | Save a scholarship and it joins your pipeline. Move it from Saved to Preparing, Submitted, Interview and Result. |
| 0:20  | Each one gets a document checklist, so you know exactly what is still missing. |
| 0:26  | Deadlines live under Notifications, with reminders 30, 14, 7 and 2 days before they close. |
| 0:34  | Get organised for free at thexcel360.com. |

## 4. Mentorship — `voiceover-mentorship.mp3` (~43 s)

| Time  | Line |
|-------|------|
| 0:00  | Applying abroad is hard. With Xcel360, you don't have to do it alone. |
| 0:05  | Membership is free. Sign up and you get matched scholarships, events, cohorts and 100 AI credits. |
| 0:11  | Our mentorship cohorts have guided more than 200 students, from shortlist to submitted application. |
| 0:18  | Need one-to-one help? Book a strategy call, an application review or interview practice with an advisor. |
| 0:25  | Join free webinars and CV clinics, and get a certificate anyone can verify. |
| 0:32  | Follow us on WhatsApp and YouTube, and once you win, come back as a mentor. |
| 0:38  | Join free at thexcel360.com. |

## 5. WritingSuite — `voiceover-writing.mp3` (~39 s)

| Time  | Line |
|-------|------|
| 0:00  | Meet the Xcel360 writing tools, built around your own story. |
| 0:05  | Start with the CV Builder. Choose an academic CV for scholarships, or a job CV for employers, and the questions change to match. |
| 0:13  | Then draft your statement of purpose, cover letters and emails to supervisors. |
| 0:20  | Every draft is saved for 30 days. Delete one by mistake? It waits in Trash for 30 more, ready to restore. |
| 0:27  | Building something of your own? Launchpad helps you test an idea and plan your first month. |
| 0:34  | Start writing free at thexcel360.com. |
