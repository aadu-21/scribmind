# Scribmind
### *don't forget.*

A student assignment/task tracker, Kanban board, and rich sticky-note
workspace (typed + handwritten) with optional desktop floating notes.
Originally scoped under the working name "StudentFlow" — same SRD, same
app, new name.

## Stack

- **Frontend:** Next.js 16 (App Router) + React + TypeScript + Tailwind v4.
  State lives in a Zustand store persisted to `localStorage`, so the app is
  fully usable — including "survives a restart" — with **zero backend**.
- **Backend (optional):** FastAPI + SQLModel, deployed as a single Vercel
  Python serverless function (`api/index.py`). Gives you real persistence
  across devices/browsers once you point it at a Postgres database.
- **Drag & drop:** `@dnd-kit` (Kanban), `react-rnd` (sticky notes:
  drag + resize).
- **Rich text:** Tiptap (bold/italic/underline/strike/headings/lists/
  checkboxes/links/highlight/color, with native undo-redo and the standard
  Ctrl/Cmd shortcuts).
- **Handwriting:** hand-rolled SVG stroke recorder. Strokes are stored as
  vector point arrays (`{x, y}[]`), not a pasted raster image, so they stay
  editable/erasable per-stroke, per the SRD's constraint #2.

## Why localStorage-first, with optional accounts

A student's own device is the common case, and a working offline app beats
a half-working online one. The app at `/dashboard` and everything under it
works fully with **no account and no backend** — data lives in
`localStorage`. Signing up (`/signup`) doesn't gate anything; it just
unlocks **Settings → Cloud sync**, so your tasks and notes can follow you
to another device. The landing page (`/`) is honest about this: "sign up
free" sits right next to "or just start scribbling — no account needed."

## Accounts

`/signup` and `/login` hit real endpoints (`/api/auth/signup`,
`/api/auth/login`) backed by a `User` table — passwords are hashed with
PBKDF2-SHA256 (200,000 iterations, random per-user salt), never stored or
logged in plain text. A successful signup/login returns a signed, 30-day
session token (HMAC-SHA256, hand-rolled with stdlib `hmac`/`hashlib` in
`api/auth.py` rather than pulling in a JWT library for something this
small) that the frontend stores in `localStorage` and sends as
`Authorization: Bearer <token>` on every `/api/*` call. Every resource
table (`Task`, `StickyNote`, `KanbanColumn`, `Category`, `Tag`) has a
`user_id` column, and every backend endpoint filters by the authenticated
user — one account's data is never visible to another's.

**Set `AUTH_SECRET`** (see `.env.example`) to a long random string in
production. It signs every session token; anyone who has it can forge a
valid login for any account. The backend falls back to an insecure
default if unset, which is fine for local development only.

## The one requirement that needs an honest caveat: desktop floating notes

The SRD asks for a sticky note that floats on top of *other native
applications* on the user's desktop. That is genuinely not something a
browser tab hosted on Vercel can do — it would require a desktop shell
(Electron/Tauri) as a companion app, which is outside "Python + React on
Vercel."

What's implemented instead is the closest honest equivalent available to a
web app: the **Document Picture-in-Picture API**
(`window.documentPictureInPicture`), supported in Chromium desktop browsers
(Chrome/Edge 116+). Clicking "Pin to Desktop" on a note opens it in a real
always-on-top OS window that stays visible while you use other apps, and
stays editable — it just requires a Chromium browser and only exists while
that browser is running. Firefox/Safari, or closing the browser entirely,
fall back to an in-app pinned note with a toast explaining why. If you
later want true always-on-top notes independent of any browser, the
Kanban/notes data model here (positions, colors, rich content, strokes) is
already shaped to drop into an Electron/Tauri shell without changes.

## Local development

### Frontend only (localStorage, no backend needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — everything works, including sticky notes,
Kanban, and handwriting.

### With the backend too

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn index:app --reload --port 8000
```

In another terminal:

```bash
echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" >> .env.local
npm run dev
```

Then use **Settings → Cloud sync** (after signing up on `/signup`) to push
your local data up, or pull it back down on another device. Without
`DATABASE_URL` set, the backend uses a local SQLite file
(`api/scribmind_dev.db`) — fine for development, not for production
(see below).

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset:
   **Next.js** — it's auto-detected).
2. Vercel builds `api/index.py` as a Python serverless function
   automatically; `vercel.json` routes `/api/*` to it.
3. **Set `DATABASE_URL`** in the Vercel project's Environment Variables to
   a Postgres connection string — [Vercel
   Postgres](https://vercel.com/storage/postgres),
   [Neon](https://neon.tech), and [Supabase](https://supabase.com) all
   work. Vercel's serverless filesystem is ephemeral, so SQLite will not
   persist in production — Postgres is required for the backend to be
   useful once deployed.
4. **Set `AUTH_SECRET`** too — a long random string (e.g.
   `openssl rand -hex 32`). Without it, sessions are signed with a public
   default value and anyone could forge a login.
5. Deploy. The frontend works immediately; accounts and cloud sync start
   working as soon as `DATABASE_URL` and `AUTH_SECRET` are set (the
   frontend calls `/api/*` on the same domain automatically — no need to
   set `NEXT_PUBLIC_API_BASE` in production).

## Project structure

```
src/
  app/
    page.tsx             landing page (public)
    login/, signup/       auth pages (public)
    (app)/                 route group — dashboard, kanban, notes, calendar,
                            tasks, completed, settings, all wrapped in AppShell
  components/
    nav/               sidebar, global search, + Create menu, app shell, auth shell
    kanban/             board, column, task card, task detail modal
    notes/               sticky note, rich editor, handwriting canvas, desktop PiP window
    dashboard/           stats, task rows/list items
    calendar/            month view
    shared/              badges, empty states, toasts
  lib/
    types.ts             all domain types + defaults
    store.ts              Zustand store: tasks, notes, columns, categories, settings
    authStore.ts            session store: signup/login/logout, persisted token
    uiStore.ts             modal/toast UI state (not persisted)
    api.ts                 authenticated backend sync client
    utils.ts, seed.ts

api/
  index.py               FastAPI app (auth + all REST endpoints)
  auth.py                  password hashing + session tokens (stdlib only)
  models.py               SQLModel tables, incl. User
  db.py                    engine/session (Postgres in prod, SQLite in dev)
  requirements.txt
```

## What's deliberately out of scope for this pass

The SRD is large (50 sections). This build covers the core structural and
acceptance-criteria items — Kanban with real drag/reorder/WIP limits, the
full task model, the sticky-note workspace with drag/resize/pin/color,
rich text + vector handwriting in the same note, note↔task conversion,
dashboard, calendar, search, and settings/export/import. Not yet built:
recurrence actually generating repeat tasks, reminder notifications,
attachment file storage, and OCR search over handwriting — all mentioned
in the SRD as optional/later-phase items. The data model already has
fields for most of these, so they're additive rather than restructuring
work.
