Design a complete UI redesign for "Live Poll" — a real-time audience polling web app with 4 screens. The app lets a host create poll sessions, add questions, present live results on a big screen, and lets audience members vote from their phones.

**Brand & Tone:** Fun, modern, confident. Think conference/stage energy — bold typography, vibrant but not overwhelming. Dark theme preferred (current palette is dark navy with teal accent #5eead4). Open to a fresh palette if it works better.

**Fonts currently used:** Space Grotesk (display), Outfit (body). Feel free to suggest alternatives.

---

**Screen 1 — Admin Dashboard (`/`)**
The home screen for the poll host. Contains:
- Top bar with "Live Poll" brand + tagline
- "New session" card with a title input + Create button
- "Your sessions" list — each row shows: session title, join code (e.g. "BQCYUH"), status badge (draft/live/ended), and Edit + Present buttons
- Empty state when no sessions exist

**Screen 2 — Session Editor (`/session/:id`)**
The most complex screen. The host builds and controls a poll session here:
- Back button + session title + status badge
- **Controls card:** Go Live / End Session / Reset to Draft buttons, join code display, Open Presenter / Open Join Page / Copy Join Link buttons
- **QR code card:** Shows a QR code for the join URL + the URL text below it
- **Add question form:** Prompt textarea, question type dropdown (True/False, Multiple Choice, Scale), options textarea (one per line), Add button
- **Questions list:** Ordered list of questions, each showing: question number + type label, prompt text, options preview (joined with " · "), reorder up/down buttons, delete button
- The Controls + QR cards sit in a 2-column grid on desktop, stack on mobile

**Screen 3 — Presenter View (`/present/:code`)**
Full-screen view designed for projection on a big screen at events:
- Top bar: brand, session title, join code, status badge, response count badge, "Editor" link
- Main area: "Question X of Y" indicator, large question text, horizontal bar chart showing results — each bar has: option label, percentage + count, animated fill bar with gradient (teal to sky blue)
- Bottom: Previous / Next navigation buttons
- Must be highly legible from a distance — large fonts, high contrast
- Bars animate smoothly when votes come in (currently uses CSS transition on width)

**Screen 4 — Join / Vote (`/join/:code`)**
Mobile-first voter screen — audience opens this on their phone:
- Centered card layout (max 440px wide)
- "Live Poll" brand at top
- **Waiting states** (3 variants):
  - "Not live yet" — pulsing dot + session title + "Hang tight" message (session is draft)
  - "Waiting for next question" — pulsing dot + "Your answer is in" message (already voted on current question)
  - "Session ended" — "Thanks for playing" message
- **Voting state:** Session title, large question prompt, vertical stack of option buttons — full-width, large touch targets (currently 16px border-radius, 1.1rem padding)
- Buttons should feel tappable and satisfying (current has hover lift + active scale)

---

**Design deliverables:**
1. All 4 screens at desktop resolution
2. Mobile variants for Screen 1 (Admin), Screen 2 (Editor), and Screen 4 (Join — this is the primary mobile screen)
3. Component design for: buttons (primary/secondary/ghost/danger), badges (draft/live/ended), form inputs, bar chart row, choice button, QR card
4. Consider micro-interactions: vote button tap feedback, bar chart fill animation, pulsing waiting indicator, status transitions

**Constraints:**
- Must work well on projectors (Presenter screen) — avoid thin fonts and low-contrast elements on that screen
- Join screen must be thumb-friendly on small phones (320px+)
- Keep the UI minimal — hosts are setting up polls backstage, voters are in an audience, neither has time for complexity
