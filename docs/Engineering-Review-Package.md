# Layout Editor v2 — Engineering Review Package

**From:** Karan Nagrale (Product) · **Date:** July 2, 2026 · **Status:** Manager-approved, ready for eng review

---

## 1. What is this

A visual layout editor so marketers can edit game layouts without touching JSON. Supports all 18 game types, schema-driven property editing, undo/redo, brand kit, and per-game settings.

| Metric | Value |
|---|---|
| Repos touched | 2 |
| Backend change | 1 new file + 2 lines modified |
| Frontend (new) | 24 files, ~19,000 lines |
| Existing code modified | 0 controllers, 0 models |

---

## 2. Campaigns-API Changes (CustomerGlu repo)

Adds internal API routes at `/campaigns/v1/internal/*` using `x-api-key` auth instead of Auth0 JWT. All routes call **existing controller methods** — zero logic duplication, zero model changes.

### Files changed

| File | Change | Lines |
|---|---|---|
| `src/api/routes/v1/internal.route.js` | **NEW** | 247 |
| `src/api/routes/v1/index.js` | **+2 lines** | 2 |

### Exact change to index.js

```javascript
// Line ~11 — add import:
const internalRoutes = require("./internal.route");

// Line ~38 — add mount (before the /:client/ route):
router.use("/internal", internalRoutes);
```

### All 12 routes added

| Method | Path | Controller |
|---|---|---|
| GET | /internal/campaigns/list | campaign.list |
| POST | /internal/campaigns/new | campaign.createCampaign |
| GET | /internal/campaigns/:id | campaign.get |
| PATCH | /internal/campaigns/:id | campaign.updateCampaign |
| POST | /internal/layout | campaign.upsertLayoutObject |
| DELETE | /internal/layout | campaign.deleteLayoutObject |
| POST | /internal/fragmentmap/add | campaign.createFragmentMap |
| GET | /internal/fragmentmap/:id | campaign.getFragmentMap |
| PATCH | /internal/fragmentmap/:id | campaign.updateFragmentMap |
| GET | /internal/theme | campaign.getThemeConfig |
| POST | /internal/theme | campaign.saveThemeConfig |
| GET | /internal/theme/fonts | campaign.getFonts |

### Auth mechanism

Dual auth: `x-api-key` header (client writeKey, looked up via `Client.findOne`) + optional `x-internal-secret` (env var `INTERNAL_API_SECRET`; if unset, dev mode allows all). No Auth0 JWT needed for these routes.

### Env vars needed

```
INTERNAL_API_SECRET=<shared-secret>   # Optional — if not set, dev mode (no secret check)
```

> The full source of `internal.route.js` is in the dashboard repo under `campaigns-api-changes/` — ready to copy into the campaigns-api repo as-is.

---

## 3. cglu-dashboard (New Repo)

Standalone React 18 + Vite app. Does **not** modify the existing Preact dashboard. Can be deployed alongside or merged later.

**Code:** https://github.com/karannagrale-tech/cglu-dashboard

### Setup

```bash
git clone https://github.com/karannagrale-tech/cglu-dashboard.git
cd cglu-dashboard
npm install
npm run dev
# Open http://localhost:4200
```

> Needs Campaigns-API running at localhost:8080 for live data. Without it, the editor still loads with default templates for all 18 game types.

### Key files

| File | What it does | Lines |
|---|---|---|
| `src/engine/layoutState.js` | State reducer: 20 actions, 50-step undo/redo, validation | 799 |
| `src/engine/elementSchema.js` | 27 element types, 18 game schemas, validation, node factory | 1,869 |
| `src/components/LocalPreview.jsx` | Visual preview renderer for all 18 game types | 2,413 |
| `src/components/NodeEditorPanel.jsx` | Schema-driven property editor (color pickers, dropdowns, etc.) | 887 |
| `src/components/GameSettingsPanel.jsx` | Per-game settings: timer, difficulty, attempts, intro screen | 1,222 |
| `src/components/AddElementPanel.jsx` | Add text/image/button/divider/coupon/T&C to any layout | 1,106 |
| `src/components/BrandKit.jsx` | Brand colors + presets (IndiGo, Swiggy, Flipkart, Nykaa) | 370 |
| `src/pages/LayoutEditor.jsx` | Main 3-panel editor: structure tree / preview / editor | 677 |
| `src/pages/CampaignDetail.jsx` | Campaign detail + play frequency + activities config | ~950 |
| `src/constants/defaultFragmentMaps.js` | Default templates for all 18 game types | 2,088 |
| `docs/Technical-Changes-Map.md` | Every bug found and fixed, with before/after code | — |

---

## 4. How to Verify

1. Campaign list loads at `/` — shows all campaigns with status badges, game type icons, search, filters
2. Click any campaign — detail page loads with tabs (Overview, Audience, Rewards, Activities, Widgets, Schedule)
3. **Schedule tab** — Play Frequency controls: presets (Once only, 1x/day, 3x/day, Unlimited), occurrence type/value, retry count
4. **Activities tab** (multistep/streak campaigns) — add/remove activities with title, event, description, required count
5. Click "Edit Layout" — editor opens with 3 panels: structure tree, preview, property editor
6. Click elements in preview — properties appear in the Editor tab with proper controls
7. Change a color or text — preview updates instantly (no save needed)
8. Add an element (text, image, button) via "+ Add Element" — appears in preview and structure tree
9. Brand Kit — pick a preset or set custom colors, click "Apply Brand" — entire game rethemes
10. Ctrl+Z / Ctrl+Y — undo/redo works for all change types
11. Settings tab — shows game-specific settings (quiz timer, spin duration, scratch threshold, etc.)

---

## 5. Architecture Decisions

**Single-state reducer, not dual-state**
All layout state lives in one `useReducer`. The old editor had fragmentMap and ProgramLayout diverging silently. Now there's one `byId` map, one dispatch, one undo stack.

**Local preview, not iframe/cache**
The preview renders directly from React state. No Constellation iframe, no Redis cache, no 5-layer cache invalidation. On deployment, the Constellation iframe works too (same-origin), but editing always reads from local state.

**Schema-driven, not hardcoded**
Each element type declares its editable properties in `elementSchema.js`. The editor generates controls from that schema. Adding a new element type = adding a schema entry, not new UI code.

**Internal API routes, not JWT**
The dashboard authenticates with `x-api-key` (writeKey) so it doesn't need Auth0 JWT flow. The routes are a thin auth wrapper on top of the same controllers the existing dashboard uses.

---

## 6. Questions for Engineering

1. **New repo or embed?** Should cglu-dashboard stay standalone, or be embedded as a route in the existing Preact dashboard?
2. **Internal API auth.** Is `x-api-key` + `x-internal-secret` sufficient, or should we use a different service-to-service auth?
3. **Campaigns-API access.** I need branch access to raise a PR for the 2-file change, or someone to apply the patch. Who can grant this?
4. **Where should the dashboard live?** Currently on my personal GitHub. Should it move to the CustomerGlu org, or a Capillary org repo?

---

**Contact:** Karan Nagrale · karan.nagrale@capillarytech.com
