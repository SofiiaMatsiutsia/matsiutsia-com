# QA: live matsiutsia.com vs. local static mirror

Date: 2026-07-09
Live site: https://matsiutsia.com/ (all 5 pages) — tested via live browser
Local copy: http://localhost:8091 (all 5 pages) — tested via local dev server preview

## Summary

The mirror is structurally solid — identical layout, typography, images, and copy on all 5 pages, zero console errors, zero failed requests, and clean responsive reflow at 1440/900/375px. But two things need attention. First, the README's "known gaps" section is now **stale**: all three buttons it documents as "inert on live too" (Experiments with GenAI, Download CV, case-study Back) actually work on live today — the mirror hasn't fallen further behind, but the live site moved forward without the README being updated. Second, and more important, QA surfaced **two real mis-wired links that have nothing to do with the documented gaps**: the TeamLift AI case study's "teamlift.co" link actually opens `housinganywhere.com`, and the homepage's 6th social icon (Substack) actually opens the Vibe Coding Collective site instead of Sofiia's Substack. Both look like copy-paste errors and both are easy one-line fixes.

## Broken / divergent in local copy

| Page | Element / behavior | Live behavior | Local behavior | Severity |
|---|---|---|---|---|
| team-lift-ai | "teamlift.co" link | Opens `https://www.teamlift.co/` | Opens `https://housinganywhere.com/` — wrong destination entirely (confirmed via DOM: `<a href="https://housinganywhere.com/">` wraps all 3 breakpoint copies of the "teamlift.co" text) | **High** |
| Homepage | 6th social icon ("Substack") | Opens `https://matsiutsia.substack.com/` (verified by clicking) | Opens `https://vibecoders.global/` — same target as the "Vibe Coding Collective" link/card, not Substack | **High** |
| Homepage, all 4 case studies | "Experiments with GenAI" / "Download CV" / case-study "← Back" buttons | All three now work: GenAI → opens a Google AI Studio experiments app in a new tab; Download CV → opens a CV PDF on Google Drive in a new tab; Back → navigates to `/` | All three remain **inert** (`role="link"`, `tabindex="0"`, no `href`, no click handler — confirmed via source and a live click-through test) | **High** (regression vs. current live; README's justification for leaving these inert is no longer accurate — see audit below) |
| Homepage | Project-card hover state | Hovering a card (e.g. "Voyage Monitor Dashboard") turns the title coral/red and reveals a white card background | No hover effect — `styles/index.css` has exactly one `:hover` rule in the whole file, and it's an unrelated `animation-play-state` toggle, not a card-hover style | Medium |
| Homepage | Entrance animation | Not independently re-timed this pass (see Verification limits), but README's own description (Framer Motion fade/slide, likely staggered) stands unchallenged | Confirmed via `styles/motion.css`: single whole-page `opacity 0→1` fade on `#container`, 500ms, no stagger, no per-section scroll-triggered reveals | Medium (documented approximation, still accurate) |
| Homepage | Intro paragraph copy | "Design for the high-cognitive load, mission-critical products." | "Design for the high-cognitive load **products**, mission-critical products." — extra "products" duplicated mid-sentence (confirmed in raw HTML) | Low |
| Homepage | "AI-assisted filtering for search" card image | Live currently renders this as an autoplay `<video>` that isn't actually playing right now (`readyState: 0`, `networkState: 2` — stuck loading), so it shows as a blank gray box today | Local uses a static `<img>` in the same spot, which renders correctly | Low / informational — local is arguably *more* functional here right now, but it's a content-type divergence from source (video vs. image), consistent with the README's "runtime dropped" tradeoff |

## Matches live

- All 4 case-study URLs confirmed correct: `/voyage-monitor`, `/internal-panel`, `/team-lift-ai`, `/housing-anywhere`.
- Zero console errors and zero failed network requests on **every** local page (index, voyage-monitor, internal-panel, team-lift-ai, housing-anywhere).
- All 4 homepage project cards link to the correct case study.
- External links match live except teamlift.co (above): `90poe.io/platform-pages/operational-voyage-management` (voyage-monitor), `housinganywhere.com` (internal-panel and housing-anywhere).
- 5 of 6 social icons wired correctly: LinkedIn (verified by clicking through to the real profile), Instagram, Twitter/X, GitHub, Pinterest all point to the right handles.
- Responsive layout verified visually at 1440 / 900 / 375px on index, voyage-monitor, internal-panel, and housing-anywhere: clean single-column reflow on mobile, no overlap, no clipped text, tags wrap correctly, images scale properly. No layout breaks found.
- Typography, spacing, color palette, and tag-pill styling are visually consistent with live across all 5 pages.
- Case-study tag lists match exactly on all 4 pages (double-checked via fresh DOM reads after an initial misread — see Verification limits).
- The `/_json/.../_cms/*.json` CMS endpoint 503s on **live itself** for every page tested (not just `/`), so the mirror correctly leaves it unmirrored.
- No third-party trackers/analytics observed in live network traffic beyond same-origin `matsiutsia.com` requests.

## README claims audit

| Claim | Verdict | Notes |
|---|---|---|
| "Entrance animation is approximated, not exact" | **Accurate** | Confirmed: local is a single non-staggered fade; see Verification limits for why live's exact animation wasn't re-timed this pass. |
| "Three buttons are inert... all three are non-functional on the live site right now too" | **Stale as of today (2026-07-09)** | All three now work on live (see table above). The mirror's inert buttons no longer match live behavior — this is the biggest actionable finding from this pass. Fix per README's own suggestion: Back → `<a href="index.html">` (or the correct relative path per page), Download CV → `<a href="...">` pointing at a CV asset, GenAI → point at the live GenAI-experiments destination. |
| "Responsive breakpoints... not visually re-verified" | **Could not fully re-verify on live** | Tool-environment limitation, not a site issue — see Verification limits. Local *was* fully re-verified visually and passes cleanly. |
| "/_json/.../_cms/_index.json already 503s on the live site itself" | **Accurate, and broader than stated** | Every page's `_cms/<page>.json` companion endpoint 503s on live (internal-panel's returned 404 instead of 503 on one check), not just the homepage's — correctly unmirrored either way. |
| "No third-party trackers/analytics... all requests same-origin" | **Accurate** | Confirmed in this pass's network logs. |
| "All internal navigation... works" (local) | **Needs an asterisk** | Project-card and footer navigation works, but this claim glossed over the fact that the 3 "inert" buttons include one navigation element (Back) that live now handles as real navigation. |

## Verification limits (be aware of these)

- **Live viewport could not be resized.** `resize_window` and browser-zoom shortcuts had no effect on the live tab in this tool environment (`window.innerWidth` stayed fixed regardless) — this is the exact same limitation the README's author already flagged ("I wasn't able to resize the browser window in my tool environment"). I substituted a `matchMedia` check confirming the live CSS breakpoint at 1280px is active and consistent with the mirrored CSS, but could not visually screenshot live at 900px/375px. Local **was** fully resized and screenshotted at all 3 widths.
- **Live's entrance-animation timing/easing was not independently re-measured frame-by-frame** — automated page loads render faster than the animation is meaningfully observable via screenshots. The comparison in this report is: local's implementation (confirmed via source) vs. the README's existing characterization of live (Framer Motion-based), not a fresh side-by-side timing capture.
- **One early tag-list reading was wrong and was corrected in this pass.** A browser tab that had been reused across many navigations got into a stale/unresponsive state on `/housing-anywhere` (screenshots and DOM reads hung on a "still loading" error) and, before that was noticed, returned a stale cached reading that made it look like team-lift-ai and housing-anywhere had different tags than they actually do. Re-tested in a fresh tab: both pages' tag lists match local exactly. Flagging this so the correction is visible rather than silently dropped.
- **Not every one of the ~3 near-duplicate per-breakpoint copies of each element was individually clicked** — verified representative copies visually (at each of the 3 widths) plus confirmed via source that all copies share the same `href`/structure (grep counts of 2–3 per link, matching the "one per breakpoint" pattern the README describes).
- Did not deep-dive the "Experiments with GenAI" destination (a separate GenAI-experiments app) or the CV PDF's contents beyond confirming they load — out of scope for this pass, and the CV contains personal details not reproduced here.
