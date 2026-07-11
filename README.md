# Live Poll

Anonymous live audience polls for talks and workshops. Host authors questions, shares a join link/QR, and presents live results on stage.

Built with **Vite + React** and **Wix Headless** (Wix Data).

**Live:** https://live-poll-7eb30789-itayshmool.wix-site-host.com

---

## What it does

| Screen | Route | Who |
|--------|-------|-----|
| Admin | `/#/` | Host — create & list sessions |
| Editor | `/#/session/:id` | Host — add questions, go live, copy link/QR |
| Presenter | `/#/present/:code` | Host — dark stage UI, live bars, next/prev |
| Join | `/#/join/:code` | Audience — answer on phone, then wait |

- No login for attendees (anonymous)
- One answer per question (no edit)
- Results update every ~1.5s via polling (no WebSockets)
- Question types: **True/False**, **Multiple choice**, **Scale** (1–N + optional “I don’t know”)

---

## Quick start

```bash
npm install
cp .env.example .env   # or use existing .env from Wix init
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npx @wix/cli@latest release` | Publish `dist/` to Wix hosting |

---

## Wix setup

This project is already connected to a Wix Headless site (`wix.config.json`).

| Field | Value |
|-------|--------|
| Client ID | `VITE_WIX_CLIENT_ID` in `.env` (from `wix.config.json` → `appId`) |
| Site ID | in `wix.config.json` |

### Data collections

| Collection | Purpose |
|------------|---------|
| `PollSessions` | Session title, join code, status (`draft` / `live` / `ended`), active question |
| `PollQuestions` | Prompt, type, options (JSON), order |
| `PollVotes` | Anonymous votes (`sessionId`, `questionId`, `choice`, `voterId`) |

Permissions are **public read/write** for the single-host MVP (anyone with the admin URL can edit). Tighten later if you open this beyond yourself.

---

## Typical event flow

1. Create a session on Admin and open the Editor  
2. Add questions (T/F, MC, or scale)  
3. Click **Go live** and open the Presenter on the projector  
4. Share the join link / QR with the room  
5. Advance questions on the Presenter; bars update as people vote  
6. **End session** when done — data stays for review  

---

## Project layout

```
src/
  pages/       Admin, Editor, Presenter, Join
  lib/         Poll helpers + hash navigation
  wixData.js   @wix/sdk + @wix/data API layer
  index.css    Dark stage-friendly UI
```

---

## Notes

- Routing uses **hash URLs** (`/#/join/ABC123`) so static Wix hosting works without server rewrites.
- Attendee identity is a random id in `localStorage` (blocks double votes on the same device).
- Admin is **not** login-gated in v1.
