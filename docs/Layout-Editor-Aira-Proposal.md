# Layout Editor Stabilization

**Owner:** Karan Nagrale (Product) · **Date:** June 2026 · **Status:** POC Complete — Ready for Staging Review

---

## Executive Summary

We built a working proof-of-concept that fixes the core problems with the CustomerGlu layout editor:

1. **The editor is broken** — marketers edit raw JSON, the preview doesn't reflect changes, there's no validation, and one wrong character can break a live game. This costs engineering hours in support and blocks marketers from self-serving.

2. **Editing is slow and manual** — reskinning a game for a campaign takes hours of manual work. There's no brand kit, no element addition UI, and no play frequency controls.

3. **Missing configuration UI** — play count, activity setup, and game mechanics are not exposed to marketers in the dashboard.

**What we built:** A new layout editor dashboard with a visual preview, schema-driven property editing, brand kit, play frequency controls, activity configuration, and support for all 18 game types — all running against the real CustomerGlu backend APIs.

**Key outcome:** A marketer can now open any of the 18 game types, visually edit every element (colors, text, images, buttons), apply a brand theme in one click, add new elements, configure play frequency, and set up multistep activities — all without touching JSON or asking engineering.

---

## Layout Editor — Problems, Solutions, and Changes

### The problems (from a marketer's perspective)

#### Problem 1: "I changed something but the preview didn't update"

**What marketers experience:** They edit a value in the layout editor, click save, but the phone preview in the center still shows the old layout. They have to wait, refresh multiple times, or ask engineering to "clear the cache."

**Root cause found in audit:**
- The preview iframe loads from the Constellation app, which reads from Redis cache with a 5-minute TTL
- Cache warming after save can silently fail (errors are caught and swallowed in try/catch at `campaign.controller.js` line 2321)
- The `warmLayoutCache` function filters by `layoutType: 'rewardLayout'` — if the layout was saved without this field, the warm finds nothing and skips silently
- `invalidateCampaignCaches` uses Redis SCAN with pattern `client:${id}:campaigns:*` but warmed keys use pattern `Campaign:${client}:${id}:${type}` — the invalidation pattern doesn't match the warmed keys

**What we built:**
- **Single source of truth** — One `useReducer` state object. The preview renders directly from this state as a pure function. No separate cached copy. Change a value → preview updates in the same render cycle.
- **Local preview renderer** — A React component (`LocalPreview.jsx`, 2,413 lines) that renders all 18 game types from the `byId` node map. No iframe, no external fetch, no cache. Click an element to select it.
- When deployed on `*.customerglu.com`, the existing Constellation iframe becomes interactive (same-origin) and the local renderer becomes optional.

#### Problem 2: "I broke the game with one wrong character"

**What marketers experience:** They accidentally delete a comma in the JSON editor, or set a color to "bleu" instead of "#0000FF", or leave a required field empty. The game breaks silently — no error, no warning, it just stops working for users.

**Root cause found in audit:**
- `PATCH /fragmentmap/:fragmentMapId` has ZERO validation — the entire request body is passed directly to MongoDB `findOneAndUpdate` with no schema validation, no field whitelist, no sanitization
- `POST /layout` has ZERO validation — same issue
- A frontend bug could overwrite `_id`, `client`, `createdAt`, or any other field
- No node `type_id` validation anywhere — any arbitrary string ships
- No CSS value validation — potentially malicious content can be injected
- No `children` reference validation — broken parent-child references create orphaned nodes

**What we built:**
- **Declarative element schema** (`elementSchema.js`, 1,869 lines) — Every element type (27 total) has typed property definitions: what fields exist, what type they are (string, color, number, image, select), what's required, what the valid range is, what the default is
- **Schema-driven editor** — The property panel auto-generates controls from the schema. A color property shows a color picker. A select shows a dropdown. A required field shows a red border when empty. Marketers never see raw JSON.
- **Validation on every change** — The reducer runs `validateNode()` after every update. Invalid changes still apply (don't block editing) but set `validationWarnings` that the UI can display.
- **Read-only JSON viewer** — Power users can view JSON but the primary interface is always the generated controls.

#### Problem 3: "Every game is different, I have to relearn each one"

**What marketers experience:** The scratch card JSON has different keys than the spin wheel JSON, which is different from the quiz JSON. 18 games = 18 different mental models. The structure tree shows raw node IDs like `ROOT`, `CONDITIONAL_2`, `SC` with no explanation.

**Root cause found in audit:**
- No shared element model — each game's JSON uses ad-hoc keys
- The structure tree shows developer node IDs, not human-readable names
- No consistent pattern for common elements (background, title, button, etc.) across games

**What we built:**
- **Shared element vocabulary** — 13 common element types that recur across all games: Background, Image, Text, Button, Container, ConditionalWrapper, RewardSlot, CouponCode, FormField, GameComponent, CountdownTimer, TermsAndConditions, Animation
- **Game-specific extensions** — Each game has a unique GameComponent with its own properties (slices for spin wheel, questions for quiz, grid for memory game, etc.) but the surrounding elements are consistent
- **Human-readable structure tree** — Instead of `TEXT_1: { ... }`, marketers see `📝 Title — "Scratch and Discover"` with icons, friendly names, and content previews
- **18 default templates** — Every game type has a pre-built layout template with appropriate colors, text, and structure. Creating a new campaign auto-loads the right template.

#### Problem 4: "I can't undo"

**What marketers experience:** They make a change they don't like and have no way to go back.

**What we built:**
- **50-step undo/redo** — Every state-changing action pushes the previous state to an undo stack. Ctrl+Z undoes, Ctrl+Y redoes. Works for all operations.
- **Single editing path** — All changes go through the same `layoutReducer`. No divergence possible.
- **Dirty tracking** — The "Save Changes" button is only enabled when there are unsaved changes.

#### Problem 5: "I can't add new elements"

**What marketers experience:** Adding a new text block, an image, or a divider requires editing raw JSON.

**What we built:**
- **Add Element panel** — Click "+ Add Element" → pick from 6 element types (Text, Image/GIF, Button, Divider, Coupon Code, Terms & Conditions) → configure → choose position → add
- **Image upload** — Upload from computer (converts to data URL) or paste URL. Preview thumbnail shown inline.
- **Schema-validated** — New nodes are created from the element schema with proper defaults and validated before insertion.

#### Problem 6: "Reskinning takes too long"

**What marketers experience:** When a campaign needs a seasonal theme or brand alignment, every element needs individual changes. This takes hours.

**What we built:**
- **Brand Kit** — Set brand colors once (7 color fields + logo), apply to any game with one click.
- **Theme presets** — 5 built-in themes (Festive, Dark, Minimal, Ocean, Nature).
- **Brand presets** — Pre-loaded brands (IndiGo, Swiggy, Flipkart, Nykaa) as starting points.
- **Brand persistence** — Saves to localStorage across sessions.

#### Problem 7: "I can't control how many times users play"

**What marketers experience:** There is no UI in the production dashboard to change play frequency. The Schedule & Launch tab only has start/end timing. To allow users to play more than once, engineering has to update the database directly.

**Root cause:** The `validity.occurrence` (type + value) and `retryCount` fields exist in the campaign model but are never exposed in the dashboard UI.

**What we built:**
- **Play Frequency controls** in Schedule & Launch tab:
  - Frequency period: Lifetime / Daily / Hourly
  - Plays allowed per period (number input)
  - Retry count
  - Quick presets: "Once only", "1x per day", "3x per day", "5x per day", "Unlimited"
- **Auto-Reset toggles**: Reset on completion, reset on expiry, with max reset limits
- Maps directly to existing `validity.occurrence.type`, `validity.occurrence.value`, `retryCount`, `timeLimit.recurAtCompletion`, `timeLimit.recurAtExpiry` — no backend changes needed.

#### Problem 8: "I can't configure activities for multistep campaigns"

**What marketers experience:** Setting up activities for multistep, streak, or gamechallenge campaigns requires engineering.

**What we built:**
- **Activities tab** — appears for multistep/gamechallenge/streak/collectthestamps campaigns
- Add/remove activities with: title, event name, description, required count
- Program title and step type (sequence / checklist / stamp collection)
- "Give reward only after all steps completed" toggle
- Maps to existing `campaign.activity.activities[]` and `campaign.stepUI` fields.

### Additional bugs found and fixed (from audit)

| # | Bug | Impact | Fix |
|---|---|---|---|
| 1 | Preview cache warm filters by `layoutType: 'rewardLayout'` — misses layouts without this field | Preview stale for up to 5 minutes | Local preview renders from state |
| 2 | FragmentMap cache warm errors swallowed silently | Save returns success but preview is stale | Local preview + dirty tracking |
| 3 | Campaign cache invalidation pattern doesn't match warmed key pattern | Old cached data persists | Local preview eliminates cache dependency |
| 4 | URL whitelisting can fail if Redis cache entry is missing | Preview iframe domain rejected | Local preview doesn't use iframe |
| 5 | Preview JWT token can expire during editing | Preview API calls fail with 401 | Local preview doesn't need JWT |
| 6 | Cached `previewLink` on Campaign document has no TTL | Dead links persist indefinitely | Preview renders from local state |
| 7 | `req.body` passed directly to `findOneAndUpdate` without field whitelist | Any field can be overwritten | Schema validation + explicit field handling |
| 8 | Node editor and theme panel used different editing paths | Changes could overwrite each other | Single `useReducer` — one editing path |
| 9 | Style template dropdown had no apply logic | Selecting a template did nothing | Themes applied via `APPLY_THEME` action |
| 10 | Unused `useHistory` hook (dead code) | Confusion for maintainers | Removed |
| 11 | `validity.occurrence` treated as single number in UI | Broken occurrence controls | Proper `{type, value}` object handling |

---

## Technical Architecture

### System overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Layout Editor Dashboard                    │
│                    (React + Vite, localhost:4200)             │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Structure   │  │  Preview    │  │  Right Panel         │ │
│  │  Tree        │  │  (Local     │  │  ┌─ Editor (schema)  │ │
│  │  (clickable  │  │   Renderer) │  │  ├─ Settings (game)  │ │
│  │   nodes)     │  │             │  │  └─ Brand Kit        │ │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘ │
│         │                 │                     │             │
│         └────────┬────────┘─────────────────────┘             │
│                  │                                            │
│         ┌────────▼────────┐                                   │
│         │  Layout State   │  ← useReducer (single source)    │
│         │  Engine         │  ← 20 action types               │
│         │  (799 lines)    │  ← 50-step undo/redo             │
│         └────────┬────────┘                                   │
│                  │                                            │
│         ┌────────▼────────┐                                   │
│         │  Element Schema │  ← 27 element types              │
│         │  (1,869 lines)  │  ← 18 game schemas               │
│         └─────────────────┘                                   │
└──────────────────────────────────────────────────────────────┘
                           │
                    Save / Load
                           │
              ┌────────────▼────────────┐
              │  CustomerGlu APIs        │
              │  /internal/campaigns/*   │
              │  /internal/fragmentmap/* │
              └─────────────────────────┘
```

### Backend changes (Campaigns-API) — 2 files only

| File | Change |
|---|---|
| `routes/v1/internal.route.js` | **NEW** — 10 internal API routes using `x-api-key` auth. Calls EXISTING controllers. |
| `routes/v1/index.js` | **+2 lines** — import + mount |

---

## Deployment Plan

### Phase 1: Staging
1. Deploy dashboard to staging subdomain
2. Rebuild Campaigns-API Docker image with internal routes
3. Test with 3-5 marketers, collect feedback

### Phase 2: Production
1. Integrate into existing Preact-Dashboard or deploy standalone
2. Wire save pipeline with existing cache warming
3. Add to existing `editorOrAdmin` permission model

---

## Success Metrics

| Metric | Current | Target |
|---|---|---|
| Preview-desync reports | ~weekly | Near zero |
| % of layout edits without JSON | ~0% | ~100% |
| Time to reskin a game | Hours (eng ticket) | Minutes (self-serve) |
| Broken-game incidents | Occasional | Zero (validation) |
| Games supported | 5 (core) | 18 (all types) |
| Play frequency changes | Engineering only | Self-serve for marketers |

---

## Appendix: How to Demo

```bash
~/cglu-start.sh
kubectl port-forward -n cglu svc/campaigns-api 8080:80 &
cd ~/workarea/cglu-dashboard && npm run dev
# → http://localhost:4200/
```

1. Campaign list → click campaign → detail page with tabs
2. Schedule & Launch → Play Frequency presets (3x per day, unlimited, etc.)
3. Activities tab (multistep) → add/configure steps
4. Edit Layout → 3-panel editor → click elements → edit properties
5. Brand Kit → apply brand → consistent theming
6. Add Element → text/image/button
7. Ctrl+Z → undo
