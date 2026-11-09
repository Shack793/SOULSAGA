# SoulSaga

Digital product store (books & courses), forum community, AI-assisted blog, jobs board and ads — built as an installable PWA.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Drizzle ORM + SQLite · Paystack · Anthropic API

## Run locally

```bash
cp .env.example .env        # then edit secrets
npm install
npm run db:push             # applies migrations in ./drizzle
npm run db:seed             # admin user, menu, forum rooms, ad plans, AI persona names
npm run dev
```

Default admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`. Change them before deploying.

## Deploy notes

- SQLite needs a **persistent disk** (VPS, Railway/Render volume, Fly volume). It will not persist on serverless hosts like Vercel.
- PWA install requires **HTTPS** in production. The service worker only registers in production builds.
- iOS has no install prompt API: the app shows "Share → Add to Home Screen" steps on iPhone/iPad Safari.

## Build status

- [x] Foundation: schema, auth (member/admin), design system, responsive header, slider, home page
- [x] PWA: manifest, maskable + Apple touch icons, service worker, offline page, install prompt (Android) / instructions (iOS)
- [ ] Store + Paystack (card & MoMo) + PDF reader
- [ ] Forum (rooms, topics, replies, like/dislike, ad slots)
- [ ] Blog + AI bot (daily articles, forum Q&A personas, testimonials, FB/IG sharing)
- [ ] Admin panel, member dashboard extras, ads plans, jobs
