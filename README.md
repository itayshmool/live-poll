# poll-it.live

Real-time audience polling for talks, workshops, and live events.

**Live at [poll-it.live](https://poll-it.live)**

---

## What it does

A host creates a poll session, adds questions, and presents results on a big screen. The audience votes from their phones by entering a six-letter join code — no app install, no sign-up.

| Screen | Route | Who |
|---|---|---|
| Landing | `/#/` | Public homepage |
| Admin | `/#/admin` | Host — create & manage sessions |
| Editor | `/#/session/:id` | Host — add questions, go live, share QR |
| Presenter | `/#/present/:code` | Host — full-screen results for projectors |
| Join | `/#/join/:code` | Audience — vote from any phone |
| Results | `/#/results/:code` | Anyone — final vote breakdown |

### Features

- Three question types: multiple choice, true/false, 1-5 scale
- Voters can change their answer while a question is live
- QR code + six-letter join code for instant audience access
- Presenter view built for projectors (large type, high contrast)
- Results update via 3s polling with smart deduplication
- Session lifecycle: draft &rarr; live &rarr; ended (with reset-to-draft)
- No login required for voters (identity via localStorage random ID)

---

## Quick start

```bash
npm install
cp .env.example .env          # add your Wix client ID
npm run dev                    # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build &rarr; `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest test suite |
| `npx @wix/cli release` | Publish to Wix CDN |

---

## Tech stack

- **React 19** single-page app (Vite)
- **Wix Headless** &mdash; [Wix SDK](https://dev.wix.com/docs/sdk) + Wix Data collections for storage
- **Wix OAuth** (PKCE) for host authentication
- Hash-based routing (no server-side rewrites needed)
- Deployed to Wix CDN with custom domain via `@wix/cli`

### Data collections

| Collection | Purpose |
|---|---|
| `PollSessions` | Title, join code, status (`draft`/`live`/`ended`), active question pointer |
| `PollQuestions` | Prompt, type, options (JSON array), display order |
| `PollVotes` | `sessionId`, `questionId`, `choice`, `voterId` |

---

## Project structure

```
src/
  pages/          Landing, Admin, Editor, Presenter, Join, Results, Login
  components/     Logo
  lib/            poll.js (constants), nav.js (hash router)
  wixData.js      Wix SDK client + all data operations
  index.css       Full design system (dark theme, stage-friendly)
public/
  favicon.svg, icons.svg, robots.txt, sitemap.xml, llms.txt
```

---

## How it works at scale

Polling is optimized for 100+ concurrent voters:

1. Voter clients poll every 3s (up from 1.5s)
2. `useRef` tracks the active question ID &mdash; if unchanged, `listQuestions` and `findVote` calls are skipped
3. Presenter skips `listQuestions` when the active question hasn't changed

This reduces steady-state API calls from ~200/s to ~33/s at 100 voters.

---

## Wix Headless setup

This project is connected to a Wix site via `wix.config.json`. To connect your own:

1. Create a [Wix Headless](https://www.wix.com/studio/headless-website) project
2. Run `npx @wix/cli init` and select your site
3. Create the three data collections above with public read/write permissions
4. `npx @wix/cli env pull` to get your client ID into `.env.local`

---

## License

MIT

---

Built by [Itay Shmool](https://www.linkedin.com/in/itayshmool/)
