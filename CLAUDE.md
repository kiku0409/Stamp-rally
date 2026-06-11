@AGENTS.md

# Stamp Rally — AI Assistant Guide

## Project Overview

Digital live-event stamp rally app. Attendees scan a QR code at each concert/event venue to collect a stamp. Stamps accumulate in a personal stamp book with achievement titles. Admins manage events and view participation stats. UI is in Japanese.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 · Supabase (PostgreSQL) · Vercel

---

## Repository Layout

```
app/                  # Next.js App Router pages & API routes
  admin/              # Admin UI (login, dashboard, event CRUD)
  api/                # Server-side API handlers
    admin/stats/      # GET participation stats per event
    admin/verify/     # POST admin password verification
    events/           # GET list / POST create
    events/[id]/      # GET / PUT / DELETE single event
    participants/     # POST create participant
    stamps/           # GET by participant / POST acquire stamp
  event/[qr_token]/stamp/  # QR stamp acquisition flow
  stamp-book/         # Participant's stamp collection view
  layout.tsx          # Root layout
  globals.css         # Tailwind 4 import + custom animations

components/           # Shared React components
lib/                  # Utilities and clients
  supabase.ts         # Supabase client (anon) + createAdminClient()
  storage.ts          # localStorage helpers (participant data)
  adminAuth.ts        # sessionStorage admin password + verify helper
  utils.ts            # Date formatting, achievement titles/targets

types/index.ts        # All shared TypeScript interfaces
supabase/schema.sql   # Full database schema + RLS policies
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Anon/public key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=      # Service role key (server-only, never expose)
ADMIN_PASSWORD=                 # Plain-text admin password
```

`NEXT_PUBLIC_*` vars are embedded in the client bundle. `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` must **never** appear in client code.

---

## Development

```bash
npm run dev     # Start dev server on http://localhost:3000
npm run build   # Production build
npm run start   # Run production build locally
npm run lint    # ESLint (next/core-web-vitals + typescript rules)
```

No automated tests are configured. Playwright is installed (`playwright@^1.60.0`) but has no config or test files yet.

---

## Database (Supabase)

### Tables

| Table | Key Columns | Notes |
|---|---|---|
| `events` | `id`, `title`, `event_date`, `venue`, `description`, `qr_token` (UNIQUE UUID) | Admin-managed |
| `participants` | `id`, `nickname` | Created anonymously at first scan |
| `event_stamps` | `participant_id` → participants, `event_id` → events, `stamped_at` | UNIQUE(participant_id, event_id) prevents duplicates |

### Row Level Security

- **events**: Public SELECT, service role for all writes
- **participants**: Service role only
- **event_stamps**: Service role only

All writes go through API routes that use `createAdminClient()` (service role). The browser-facing `supabase` client (anon key) can only read events.

### Supabase Clients

```typescript
import { supabase } from '@/lib/supabase';           // anon client – read-only in practice
import { createAdminClient } from '@/lib/supabase';  // service role – API routes only
```

Always call `createAdminClient()` inside API route handlers, never in components.

---

## TypeScript Types (`types/index.ts`)

```typescript
Event            // event row
Participant      // participant row
EventStamp       // stamp row (with optional nested Event)
LocalParticipant // { participant_id, nickname } stored in localStorage
StampResult      // API response for stamp acquisition
AdminStats       // { eventId, participantCount, stampCount }
```

---

## Key Conventions

### Client vs Server

- Components using `useState`, `useEffect`, browser APIs, or event handlers require `'use client'` at the top.
- API routes (`app/api/**/route.ts`) are always server-side; use `createAdminClient()` there.
- Never import `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_PASSWORD` into client components.

### Participant Identity

Participants have no auth account. Their `participant_id` and `nickname` are stored in `localStorage` via `lib/storage.ts`. The stamp book reads this ID from storage to fetch stamps.

### Admin Auth

Admin state is a plain password stored in `sessionStorage` (via `lib/adminAuth.ts`). The password is verified against `ADMIN_PASSWORD` env var via `POST /api/admin/verify`. `AdminLayout` component redirects to `/admin/login` if not authenticated.

### QR Token Flow

1. Admin generates an event → Supabase auto-generates a UUID `qr_token`.
2. `QRCodeDisplay` component encodes `{origin}/event/{qr_token}` as a QR image.
3. Attendee scans → lands on `/event/[qr_token]/stamp`.
4. Page registers/retrieves participant from localStorage, then calls `POST /api/stamps`.
5. API looks up event by `qr_token`, inserts into `event_stamps` (idempotent via UNIQUE constraint).

### Achievement Titles (`lib/utils.ts`)

| Stamps | Title |
|---|---|
| 1 | 🥉 ライブデビュー |
| 5 | 🥈 リピーター |
| 10 | 🥇 常連参加者 |
| 20 | 🏆 レジェンド参加者 |

### Styling

Tailwind CSS 4 — use `@import "tailwindcss"` syntax (not `@tailwind` directives). No `tailwind.config.ts`; default config applies. Two custom animation classes defined in `globals.css`: `.animate-bounce-slow`, `.animate-stamp-pop`.

### Date Formatting

Always use `formatDate` / `formatDateTime` from `lib/utils.ts` — they output Japanese locale (`ja-JP`).

### Path Alias

`@/*` resolves to the repository root (configured in `tsconfig.json`).

---

## Next.js 16 Notes

This project uses **Next.js 16** which has breaking changes from versions in typical training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Key things that may have changed: middleware API, caching semantics, `fetch` defaults, metadata API, and image optimization config.

---

## Deployment

Deployed to **Vercel** via GitHub integration. No CI/CD workflows exist — pushes to `main` trigger automatic Vercel deploys. Set all four environment variables in the Vercel project settings.
