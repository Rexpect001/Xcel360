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

Captions are burned in, so the videos work with the sound off (the default on most feeds).

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
