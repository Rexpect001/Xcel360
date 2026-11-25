# Xcel360 mobile app

The iOS and Android app for thexcel360.com, built with Expo (SDK 58, Expo Router).
It talks to the website's mobile API at `/api/mobile/v1` and uses the same
accounts, listings and saved lists as the website.

## Run it

```bash
cd mobile
npm install
npx expo start            # scan the QR code with the Expo Go app on your phone
npx expo start --web      # or open a browser preview
```

By default the app talks to https://thexcel360.com. To use a local website
server instead, set `EXPO_PUBLIC_API_URL`, for example:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start --web
```

On a phone, use your computer's network address (not `localhost`).

## Layout

- `src/app/` screens (Expo Router): `(tabs)/` home, explore, saved, tools, me;
  `opportunity/[id]`, `topic/[slug]`, `sign-in`, `sign-up`, `welcome`
- `src/lib/api.ts` API client: bearer token, silent refresh on 401
- `src/lib/queries.ts` data hooks (TanStack Query), optimistic save
- `src/providers/auth-provider.tsx` signed-in state; tokens in secure storage
- `src/constants/theme.ts` brand colours (light and dark) and fonts

## Server side (in the website repo)

- `src/app/api/mobile/v1/*` routes; `src/lib/mobile/*` auth and listing helpers
- Sign-in returns a 15-minute access token and a 30-day refresh token (stored
  hashed in the `Session` table, rotated on every refresh, revoked on sign-out)

## Stages

1. Foundation and browsing (this version): sign in/up, Home, Explore, detail,
   save, topics, Me. Writing tools open on the website.
2. Saved pipeline lanes, in-app notifications, push notifications, profile editing
3. Writing tools and Launchpad in the app
4. Jobs, events, certificates, news
5. Store release (EAS builds, store listings)
