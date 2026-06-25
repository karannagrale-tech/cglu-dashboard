# Engineering Handoff — Layout Editor Stabilization

**From:** Karan Nagrale (Product) · **To:** Engineering Team · **Date:** June 25, 2026

---

## 1. Summary

We've built a POC for a new layout editor that fixes the core problems marketers face: broken preview, no validation, raw JSON editing, no undo, and missing game configuration UI. The manager has reviewed and approved moving to staging.

**Two repos are affected:**

| Repo | Change Type | Scope |
|---|---|---|
| **Campaigns-API** | 1 new file + 2 lines modified | Internal API routes for service-to-service auth |
| **cglu-dashboard** (NEW) | 24 files, ~19,000 lines | New layout editor frontend |

---

## 2. Repos, Branches, and Sync Status

### Repo 1: Campaigns-API

| Item | Detail |
|---|---|
| **Repo path** | `/Users/karannagrale/workarea/cglu-local-setup-docs/Campaigns-API/` |
| **Remote** | CustomerGlu GitHub (Campaigns-API repo) |
| **Current branch** | Local copy only — not a git repo (cloned via deploy scripts) |
| **Synced with main?** | Based on the version deployed in minikube. Changes need to be applied to a new branch from main. |
| **Action needed** | Create branch `feature/internal-api-routes` from main, apply the 2 changes below |

**Changes (2 files):**

**File 1 — NEW:** `src/api/routes/v1/internal.route.js` (247 lines)
- 10 internal API routes using `x-api-key` authentication (bypasses Auth0 JWT)
- Uses EXISTING controller methods — zero logic duplication
- Dual auth: `x-api-key` (client writeKey) + optional `x-internal-secret` (service secret)
- Routes: campaign list/create/get/update, fragmentMap CRUD, layout upsert, theme get/save

**File 2 — MODIFIED:** `src/api/routes/v1/index.js` (+2 lines)
```javascript
// Line 11 — add import:
const internalRoutes = require("./internal.route");

// Line 38 — add mount (before the /:client/ route):
router.use("/internal", internalRoutes);
```

**No other backend files changed.** No model changes. No controller changes. No middleware changes.

**Env vars needed:**
```
INTERNAL_API_SECRET=<shared-secret>   # Optional — if not set, dev mode (no secret check)
```

---

### Repo 2: cglu-dashboard (NEW)

| Item | Detail |
|---|---|
| **Repo path** | `/Users/karannagrale/workarea/cglu-dashboard/` |
| **Remote** | Not yet created — needs a new repo in CustomerGlu GitHub org |
| **Current branch** | N/A (not yet a git repo) |
| **Action needed** | Create repo `cglu-dashboard` or `layout-editor-v2`, init, push |

**Tech stack:** React 18 + Vite + React Router DOM

**File structure:**

```
cglu-dashboard/
├── src/
│   ├── engine/                          # State management & schema
│   │   ├── layoutState.js       (799)   # Single-source-of-truth reducer, 20 actions, undo/redo
│   │   ├── elementSchema.js   (1,869)   # 27 element types, 18 game schemas, validation
│   │   └── index.js              (13)   # Re-exports
│   ├── components/
│   │   ├── LocalPreview.jsx   (2,413)   # Visual preview renderer for all 18 games
│   │   ├── AskAiraPanel.jsx     (687)   # AI assistant with NLP parser, brand commands
│   │   ├── NodeEditorPanel.jsx  (887)   # Schema-driven property editor
│   │   ├── AddElementPanel.jsx(1,106)   # Add text/image/button/divider/coupon/terms
│   │   ├── GameSettingsPanel.jsx(1,222) # Per-game configuration (timer, difficulty, etc.)
│   │   ├── BrandKit.jsx         (370)   # Brand color editor + presets + apply
│   │   └── StatusBadge.jsx      (113)   # Campaign status badge
│   ├── pages/
│   │   ├── LayoutEditor.jsx     (677)   # Main 3-panel editor page
│   │   ├── CampaignList.jsx     (322)   # Campaign listing with search/filters
│   │   ├── CampaignDetail.jsx   (~950)  # Campaign detail with sidebar tabs (Overview, Audience, Rewards, Activities, Widgets, Schedule)
│   │   └── CreateCampaign.jsx   (145)   # Campaign creation wizard
│   ├── constants/
│   │   ├── defaultFragmentMaps.js(2,088)# Default templates for all 18 game types
│   │   └── gameTypes.js          (58)   # Game type constants, icons, labels
│   ├── api/
│   │   └── cglu.js               (94)   # API client
│   ├── App.jsx                  (173)   # Root with routes + nav
│   ├── App.css                (3,136)   # Full CSS
│   └── main.jsx                  (13)   # Entry point
├── docs/                                # Documentation
└── package.json
```

**Dependencies:**
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^6",
  "@tanstack/react-query": "latest",
  "lucide-react": "latest"
}
```

---

## 3. Product Stories

### Epic: Layout Editor Stabilization

#### Story 1: Reactive Preview (P0)
**As a** marketer editing a game layout,
**I want** the preview to update instantly when I change any property,
**So that** I can see exactly what my changes look like without waiting or refreshing.

**Acceptance criteria:**
- [ ] Changing a text/color/image updates the preview in <100ms
- [ ] No dependency on Redis cache for preview during editing
- [ ] Error states show clearly (not blank screen)
- [ ] Works for all 18 game types

---

#### Story 2: Schema-Driven Property Editor (P0)
**As a** marketer,
**I want** to edit game properties through proper controls (color pickers, dropdowns, text inputs),
**So that** I never have to see or edit raw JSON.

**Acceptance criteria:**
- [ ] Color properties show color picker + hex input
- [ ] Select properties show dropdown with valid options
- [ ] Image properties show URL input + upload button + thumbnail preview
- [ ] Required fields show validation indicator when empty
- [ ] Read-only JSON viewer available for power users

---

#### Story 3: Add Elements (P0)
**As a** marketer,
**I want** to add new elements (text, image, button, divider, coupon code, T&C) to any game layout,
**So that** I can customize the layout without engineering help.

**Acceptance criteria:**
- [ ] "+ Add Element" button shows element type picker
- [ ] Image upload supports JPG, PNG, GIF from local file or URL paste
- [ ] New elements appear in preview immediately
- [ ] Position selectable: start, end, after selected node

---

#### Story 4: Undo/Redo (P0)
**As a** marketer,
**I want** to undo and redo my changes,
**So that** I can safely experiment without fear of breaking things.

**Acceptance criteria:**
- [ ] Ctrl+Z undoes last change, Ctrl+Y redoes
- [ ] Up to 50 undo steps
- [ ] Works for all change types (property edit, element add, theme apply)

---

#### Story 5: Brand Kit (P1)
**As a** marketer,
**I want** to set my brand colors once and apply them to any game with one click,
**So that** reskinning games for a campaign takes seconds instead of hours.

**Acceptance criteria:**
- [ ] Brand kit: primary, secondary, accent, background, CTA, text primary/secondary, logo
- [ ] "Apply Brand" button themes entire game consistently
- [ ] Brand persists across sessions
- [ ] Pre-loaded brand presets (IndiGo, Swiggy, Flipkart, Nykaa)

---

#### Story 6: Game Settings (P1)
**As a** marketer,
**I want** to configure game mechanics (timer, difficulty, attempts, intro screen) without playing the game,
**So that** I can set up the game experience as I want it.

**Acceptance criteria:**
- [ ] Each game type has its own settings panel
- [ ] Quiz: timer on/off, time per question, retry, question order
- [ ] Spin wheel: spin duration, multiple spins, sound
- [ ] Scratch card: scratch threshold, auto-reveal, effects
- [ ] Mini-games: difficulty, time limit, target score, lives, game-specific params

---

#### Story 7: Play Frequency Control (P1)
**As a** marketer,
**I want** to control how many times a user can play a game,
**So that** I can set up daily engagement or one-time campaigns.

**Acceptance criteria:**
- [ ] Frequency period: Lifetime / Daily / Hourly
- [ ] Plays allowed per period (number input)
- [ ] Retry count configuration
- [ ] Quick presets: "Once only", "1x per day", "3x per day", "5x per day", "Unlimited"
- [ ] Auto-reset toggles: reset on completion, reset on expiry
- [ ] Maps to existing `validity.occurrence` and `retryCount` fields (no backend change needed)

---

#### Story 8: Activities Configuration (P1)
**As a** marketer setting up a multistep/streak/gamechallenge campaign,
**I want** to configure activities (steps, events, completion criteria) in the dashboard,
**So that** I don't need engineering to set up the activity flow.

**Acceptance criteria:**
- [ ] Activities tab appears for multistep, gamechallenge, streak, collectthestamps campaigns
- [ ] Add/remove activities with title, event name, description, required count
- [ ] Step type: sequence / checklist / stamp collection
- [ ] Program title configuration
- [ ] "Give reward only after all steps" toggle

---

#### Story 9: All 18 Game Types Supported (P1)
**As a** marketer,
**I want** the editor to work for ALL game types,
**So that** I can edit any campaign without engineering help.

**Acceptance criteria:**
- [ ] Default layout template for each of 18 game types
- [ ] Visual preview renderer for each game type
- [ ] Game-specific settings panel for each game type
- [ ] Game-specific element schema with unique properties

---

## 4. How to Review

### Quick local setup:
```bash
# 1. Start minikube + CustomerGlu services
~/cglu-start.sh

# 2. Port-forward APIs
kubectl port-forward -n cglu svc/campaigns-api 8080:80 &

# 3. Start the dashboard
cd ~/workarea/cglu-dashboard
npm install
npm run dev
# → http://localhost:4200/
```

### What to verify:
1. Campaign list loads with all campaigns
2. Click any campaign → detail page with tabs
3. **Schedule & Launch** tab → Play Frequency controls (presets, occurrence, retry)
4. **Activities** tab (multistep campaigns) → add/remove/configure activities
5. Click "Edit Layout" → editor loads with default template
6. Click elements in preview → properties show in Editor tab
7. Change a color → preview updates instantly
8. Add an element (text, image, button) → appears in preview
9. Brand Kit → apply brand → all elements rethemed
10. Ctrl+Z → undoes
11. Settings tab → game-specific configuration

---

## 5. What Changed in CustomerGlu Code

### Backend (Campaigns-API) — minimal changes

| What | File | Change |
|---|---|---|
| Internal API routes | `routes/v1/internal.route.js` | **NEW** — 10 routes using `x-api-key` auth. Calls the SAME existing controller methods. |
| Mount internal routes | `routes/v1/index.js` | **+2 lines** — import + `router.use("/internal", internalRoutes)` |

**No controllers modified. No models modified. No middleware modified.** The internal routes are a thin auth layer on top of existing handlers.

### Frontend (cglu-dashboard) — new repo

All new code. Does NOT modify the existing Preact-Dashboard. Can be deployed alongside or eventually merged into it.

Key architectural decisions:
- `useReducer` with single state object (no dual-state divergence)
- Schema-driven editor (controls generated from element type definitions)
- Local preview renderer (no iframe/cache dependency during editing)
- All 18 game types supported via declarative schemas + templates

---

## 6. Questions for Engineering

1. **New repo or embed?** Should cglu-dashboard be a standalone repo, or embedded as a route in the existing Preact-Dashboard?
2. **Internal API auth:** Is `x-api-key` + `x-internal-secret` sufficient, or should we use a different service-to-service auth mechanism?
3. **Preview on deployment:** On `*.customerglu.com`, the Constellation iframe becomes interactive (same-origin). Should we keep the local preview as a fallback?
4. **FragmentMap validation:** Should we add Joi validation middleware to the fragmentMap PATCH route now, or after staging testing?
5. **Play frequency:** The `validity.occurrence` and `retryCount` fields already exist in the campaign model. Should we add validation bounds on the new Schedule & Launch UI values?
