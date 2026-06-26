# Technical Changes Map — What Changed, Where, and Why

**Purpose:** This document maps every problem to the exact CustomerGlu code that causes it, and the exact changes we made (or need to make) in the CustomerGlu repos to fix it. Nothing was built from scratch outside CustomerGlu — every change either modifies existing CustomerGlu code or adds new files within the CustomerGlu ecosystem.

---

## How to read this document

Each problem follows this structure:
1. **Problem** — what the marketer experiences
2. **Root cause in CustomerGlu code** — exact file, function, line number
3. **What we changed / what needs to change** — in which CustomerGlu repo, which file
4. **Status** — Done in POC / Needs to be merged into CustomerGlu repo

---

## CustomerGlu Repositories Referenced

| Repo | Path | Purpose |
|---|---|---|
| **Campaigns-API** | `cglu-local-setup-docs/Campaigns-API/` | Campaign CRUD, fragmentMap CRUD, layout save, cache warming |
| **Paint-Api** | `cglu-local-setup-docs/Paint-Api/` | Preview link generation, campaign data serving to constellation |
| **Preact-Dashboard** | `cglu-local-setup-docs/Preact-Dashboard/` | The current production frontend (source not locally available, only CLAUDE.md) |
| **Aira (cap-ai-readiness)** | `Desktop/cap-ai-readiness/` | AI assistant backend |

---

## Problem 1: Preview doesn't update after saving

### What marketer sees
"I changed a color, clicked save, but the preview still shows the old layout. I have to wait 5 minutes or ask engineering to clear the cache."

### Root cause in CustomerGlu code

**File:** `Campaigns-API/src/api/controllers/campaign.controller.js`

**Issue A — Cache warm silently fails (line 2317-2323):**
```
// updateFragmentMap method
try {
  await rewardCacheInvalidation.warmFragmentMapCache(fragmentMapId);
} catch (error) {
  logger.error(`Failed to warm...`);  // ← Error is caught and swallowed
}
res.json({ success: true });  // ← User sees "success" but cache is stale
```
The cache warm is wrapped in try/catch. If Redis is slow or connection drops, the warm fails silently. The API returns `success: true` but Paint-API still serves stale data for up to 300 seconds (the Redis TTL).

**Issue B — Cache key pattern mismatch (line 776-786):**
```
// updateCampaign method
Promise.all([
  rewardCacheInvalidation.invalidateCampaignCaches(campaignId, client),
  //   ↑ Deletes keys matching: client:${clientId}:campaigns:*
  rewardCacheInvalidation.warmCampaignCache(savedCampaign)
  //   ↑ Sets keys like: Campaign:${client}:${campaignId}:${type}
])
```
The invalidation SCAN pattern (`client:*:campaigns:*`) does NOT match the warmed key pattern (`Campaign:${client}:${id}:${type}`). Old cached keys persist until TTL expires.

**Issue C — Preview reads from separate cache (Paint-Api):**

**File:** `Paint-Api/src/api/helpers/cachingHelpers.js` (line 218-254)
```
const getSingleCampaignDetails = async (client, campaignId, ttl = 300) => {
  const redisKey = `SingleCampaignDetails:${client}:${campaignId}`;
  // L1 cache → L2 Redis → L3 MongoDB
  // TTL = 300 seconds (5 minutes)
```
Constellation calls `getSingleCampaignDetails` which has its OWN Redis cache with 5-minute TTL. Even if Campaigns-API warms its cache, this Paint-Api cache is separate and may still be stale.

### What we changed

**In Campaigns-API** (`Campaigns-API/src/api/routes/v1/internal.route.js` — NEW FILE):
- Added internal API routes that bypass Auth0 JWT for service-to-service calls
- These routes use the same controllers (`campaign.controller.js`) — no logic duplication
- The save pipeline still calls `warmFragmentMapCache` and `warmCampaignCache`

**In the new dashboard** (`cglu-dashboard/src/engine/layoutState.js`):
- Preview renders directly from in-memory state via `useReducer` — no cache dependency during editing
- Changes are visible instantly in the local preview
- Save still goes through the same `updateFragmentMap` API endpoint, triggering the same cache warm

**What still needs to change in CustomerGlu repos for production:**
1. `campaign.controller.js` line 2321: Don't swallow cache warm errors — log AND set a response flag so the frontend knows cache may be stale
2. `rewardCacheInvalidation.js`: Fix the SCAN pattern to match warmed key patterns, OR explicitly delete the warmed key before re-setting it
3. `cachingHelpers.js` line 218: Add a `warmSingleCampaignDetails` function that Campaigns-API can call after save

---

## Problem 2: No validation — one wrong character breaks the game

### What marketer sees
"I accidentally broke the JSON and the game stopped working for users. No error, no warning."

### Root cause in CustomerGlu code

**File:** `Campaigns-API/src/api/routes/v1/campaign.route.js`

**FragmentMap update — ZERO validation (line 343-344):**
```javascript
router
  .route("/:client/fragmentmap/:fragmentMapId")
  .patch(
    authenticate,
    checkJwt,
    addClientToBody,
    editorOrAdmin,
    // ← NO validation middleware here
    controller.updateFragmentMap
  );
```
Compare with campaign update which HAS validation (line 160-167):
```javascript
router
  .route("/:client/:campaignId")
  .patch(
    authenticate,
    checkJwt,
    addClientToBody,
    editorOrAdmin,
    validate(updateCampaign),  // ← Joi validation exists here
    controller.updateCampaign
  );
```

**File:** `Campaigns-API/src/api/controllers/campaign.controller.js` (line 2302)
```javascript
// updateFragmentMap
let fragmentMapObj = await FragmentMap.findOneAndUpdate(
  { _id: fragmentMapId, client },
  req.body,  // ← ENTIRE req.body passed directly. No field whitelist. No sanitization.
  { new: true, lean: true }
);
```
Any field in the request body — including `_id`, `client`, `__v`, `createdAt` — gets written to MongoDB. A frontend bug could corrupt the document.

**File:** `Campaigns-API/src/api/validations/campaign.validation.js`
- Only validates `name` (max 128 chars), `status` (enum), `type` (conditional), `questions` (for surveys)
- Does NOT validate: `slots`, `fragmentMap`, `audience`, `banner`, `offerUI`, `activity`, or any nested objects

### What we changed

**In the new dashboard** (`cglu-dashboard/src/engine/elementSchema.js` — NEW FILE, 1,869 lines):
- Declarative schema for 27 element types with typed properties
- Each property defines: type (string/color/number/select/image/boolean), label, required flag, default value, min/max range, valid options
- `validateNode()` function checks every node against its schema before state entry
- `createDefaultNode()` factory creates new nodes with proper defaults

**In the new dashboard** (`cglu-dashboard/src/engine/layoutState.js` — NEW FILE, 799 lines):
- Every state mutation goes through `layoutReducer` which validates inputs
- `UPDATE_NODE_CSS` and `UPDATE_NODE_CONTENT` run validation after applying changes
- `ADD_ELEMENT` validates the new node against schema before insertion
- Invalid changes set `state.validationWarnings` (displayed in UI) but don't block editing

**What needs to change in CustomerGlu repos for production:**
1. `campaign.route.js` line 344: Add Joi validation middleware for fragmentMap updates — whitelist allowed top-level fields (`fragments`, `data`, `theme`, `fragmentType`, `fragmentKeys`)
2. `campaign.controller.js` line 2302: Use `$set` projection instead of passing entire `req.body` — only update specific fields
3. Add a shared `validateFragmentMap()` utility that checks node structure, `type_id` validity, `children` reference integrity, and CSS value safety

---

## Problem 3: Every game is different — no shared model

### What marketer sees
"The scratch card editor is completely different from the spin wheel editor. I have to relearn each one. The structure tree shows ROOT, CONDITIONAL_2, SC — I don't know what any of these mean."

### Root cause in CustomerGlu code

**File:** `Preact-Dashboard/CLAUDE.md` (documentation of the production frontend)
```
fragmentData
├── fragments
│   ├── program.programLayout    → Layout nodes
│   └── reward.game.byId         → Game components
├── data
│   ├── slots                    → Reward slots
│   └── activityIdMap            → Activity ID → reward mapping
```
The `byId` map uses raw developer IDs (`ROOT`, `SC`, `TEXT_HELPER`, `CONDITIONAL_2`) with no human-readable labels or consistent naming across games.

**File:** `Campaigns-API/src/api/models/campaign.model.js`
Each game has its own ad-hoc config structure:
- Scratch card (line 362): `{ backgroudColor, backgroundImage }` — note the typo "backgroud" is in the actual schema
- Spin wheel (line 386): `{ slices: [{ label, backgroundColor, textColor, image, description }] }`
- Quiz (line 837): `{ count, minWinScore, questions: [{ question, options, answer, time }] }`
- Slot machine (line 366): `{ reelCount, slotImages, backgroundImage, backgroundOrigin }`
- Memory game (line 375): `{ rowCount, columnCount, cardCover, cardSymbols, timeLimit }`

No shared structure, no common element model, no consistent property names.

### What we changed

**In the new dashboard** (`cglu-dashboard/src/engine/elementSchema.js`):
- Defined 13 shared element types: Background, Image, Text, Button, Container, ConditionalWrapper, RewardSlot, CouponCode, FormField, GameComponent, CountdownTimer, TermsAndConditions, Animation
- Each game maps onto these same types (e.g., Scratch Card = Background + Text(title) + Text(subtitle) + GameComponent(scratchArea) + Container(reward) + CouponCode + Button + T&C)
- Game-specific GameComponent subtypes have their own properties but the wrapper is consistent

**In the new dashboard** (`cglu-dashboard/src/pages/LayoutEditor.jsx`):
- Structure tree shows friendly names + icons: `📝 Title — "Scratch and Discover"` instead of `TEXT_1: { ... }`
- Content preview shows the first 25 chars of text content
- Raw node ID shown in small gray text for power users

**What needs to change in CustomerGlu repos for production:**
1. Fix the `backgroudColor` typo in `campaign.model.js` line 362 (add migration for existing data)
2. The Preact-Dashboard should import the shared element vocabulary and use it for the structure tree rendering
3. No backend model change needed — the element vocabulary is a frontend concern

---

## Problem 4: No undo/redo

### Root cause in CustomerGlu code

**File:** `Preact-Dashboard/CLAUDE.md` describes the editing approach:
```
- Make deep clones of nested objects (JSON.parse(JSON.stringify()))
- Update all related sections to keep data in sync
```
There is no version history. The production editor uses deep clones for immutability but never stores previous states.

### What we changed

**In the new dashboard** (`cglu-dashboard/src/engine/layoutState.js`):
```javascript
function pushHistory(history, currentById) {
  const undo = [...history.undo, deepClone(currentById)];
  if (undo.length > MAX_HISTORY) undo.splice(0, undo.length - MAX_HISTORY);
  return { undo, redo: [] };
}
```
- Every state-changing action pushes the previous `byId` to the undo stack (max 50 entries)
- `UNDO` pops from undo, pushes current to redo
- `REDO` pops from redo, pushes current to undo
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)

**What needs to change in CustomerGlu repos for production:**
1. The Preact-Dashboard's editor should adopt the `useReducer` pattern with history stack
2. No backend changes needed — undo/redo is entirely a frontend concern

---

## Problem 5: Two editing paths diverge

### Root cause in CustomerGlu code

**File:** `Preact-Dashboard/CLAUDE.md` describes:
```
fragmentData.fragments.program.programLayout — Layout nodes
fragmentData.fragments.reward.game.byId — Game components
```
And the CLAUDE.md explicitly warns:
```
When changing streak length, update BOTH program.programLayout AND reward.game
Do not modify data.slots when adding/cloning/deleting activities in game challenges
```

This means the editor has to manually keep multiple data paths in sync. If one path is updated but another isn't, data diverges.

In our POC, we discovered the same issue: the node editor updated `workingById` but the Aira panel updated `fragmentMapRaw` — two separate state objects that could overwrite each other.

### What we changed

**In the new dashboard** (`cglu-dashboard/src/engine/layoutState.js`):
- ONE state object via `useReducer` — `state.byId` is the single source of truth
- Both the node editor and Aira panel dispatch through the same reducer
- No separate `workingById` and `fragmentMapRaw` — just `state.byId`
- `getFragmentMapForSave(state)` reconstructs the full fragmentMap from `state.byId` for API save

**What needs to change in CustomerGlu repos for production:**
1. The Preact-Dashboard should refactor to use a single state object for layout editing
2. The dual `program.programLayout` and `reward.game.byId` paths should be unified at the editor level

---

## Problem 6: Auth blocks service-to-service calls

### Root cause in CustomerGlu code

**File:** `Campaigns-API/src/api/middlewares/jwt.js` (line 29-44)
```javascript
module.exports.checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  }),
  audience: auth0Aud,
  issuer: [`https://${auth0Domain}/`],
  algorithms: ["RS256"],
}).unless(skipAuth0Check);
```
All campaign/fragmentMap routes require Auth0 JWT. There's no service-to-service auth path for tools like Aira to call these APIs.

**File:** `Campaigns-API/src/api/middlewares/authentication.js` (line 38-60)
```javascript
exports.setClient = async (req, res, next) => {
  req.body.clientData = await Client.findOne({
    apiKey: req.body.writeKey || req.headers["x-api-key"],
  }).lean();
```
An `x-api-key` auth path exists (via `setClient`) but it's only used for SDK/client-facing routes, not dashboard routes.

### What we changed

**In Campaigns-API** (`Campaigns-API/src/api/routes/v1/internal.route.js` — NEW FILE, 210 lines):
```javascript
// Middleware: Authenticate using x-api-key header
const authenticateByApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const clientData = await Client.findOne({ apiKey }).lean();
  if (!clientData) return res.status(401).json({ success: false });
  req.body.client = clientData.clientId;
  next();
};

// Optional: verify internal service secret
const verifyInternalSecret = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (!expectedSecret) return next(); // dev mode — no secret check
  if (!secret || secret !== expectedSecret) return res.status(403).json({...});
  next();
};

router.use(verifyInternalSecret);
router.use(authenticateByApiKey);
```

**Routes added (all using existing controllers — no logic duplication):**

| Method | Route | Controller method | Purpose |
|---|---|---|---|
| GET | `/internal/campaigns/list` | `campaign.list` | List campaigns |
| POST | `/internal/campaigns/new` | `campaign.createCampaign` | Create campaign |
| GET | `/internal/campaigns/:id` | `campaign.get` | Get campaign + layout |
| PATCH | `/internal/campaigns/:id` | `campaign.updateCampaign` | Update campaign |
| POST | `/internal/layout` | `campaign.upsertLayoutObject` | Upsert ProgramLayout |
| POST | `/internal/fragmentmap/add` | `campaign.createFragmentMap` | Create fragmentMap |
| GET | `/internal/fragmentmap/:id` | `campaign.getFragmentMap` | Get fragmentMap |
| PATCH | `/internal/fragmentmap/:id` | `campaign.updateFragmentMap` | Update fragmentMap |
| GET | `/internal/theme` | `campaign.getThemeConfig` | Get theme |
| GET | `/internal/theme/fonts` | `campaign.getFonts` | Get fonts |

**In Campaigns-API** (`Campaigns-API/src/api/routes/v1/index.js` — MODIFIED):
```javascript
const internalRoutes = require("./internal.route");
router.use("/internal", internalRoutes);
```
Two lines added to mount the internal routes.

**For production:**
- Set `INTERNAL_API_SECRET` env var on both Campaigns-API and Aira
- The internal routes use the SAME controller methods as the dashboard routes — same validation, same cache warming, same everything

---

## Problem 7: Aira has no access to CustomerGlu

### Root cause
The Aira platform (`cap-ai-readiness`) has integrations for Capillary services (Iris, Intouch, Arya) but zero CustomerGlu integration. No API client, no MCP tools, no knowledge of the layout data model.

### What we changed

**In Aira backend** (`cap-ai-readiness/api/capdoc/`):

| File | Change |
|---|---|
| `config.py` | Added: `CUSTOMERGLU_CAMPAIGNS_API_HOST`, `CUSTOMERGLU_PAINT_API_HOST`, `CUSTOMERGLU_API_KEY`, `CUSTOMERGLU_INTERNAL_SECRET` |
| `constants.py` | Added: `AI_GAMIFICATION_BOT_ENABLED` feature flag |
| `copilot/mcp/rbac.py` | Added: `check_gamification_bot_access()` — RBAC gate for gamification tools |
| `copilot/mcp/server.py` | Added 5 MCP tools: `get_gamification_library`, `list_gamification_campaigns`, `get_gamification_layout`, `update_gamification_layout`, `generate_gamification_preview` |
| `copilot/playbooks/layout_editor.py` | NEW: 6-phase playbook (Identify → Understand → Clarify → Plan → Execute → Verify) |
| `copilot/library_prompts/gamification.py` | NEW: Complete data model reference for all 18 game types |
| `copilot/playbooks/__init__.py` | Added `layout_editor` to PLAYBOOKS registry |
| `infra/api/customerglu/client.py` | NEW: HTTP client with `x-api-key` + `x-internal-secret` auth |
| `infra/api/customerglu/read/campaigns.py` | NEW: Read operations (list, get, fragmentMap, theme, preview) |
| `infra/api/customerglu/write/layouts.py` | NEW: Write operations (upsert layout, CRUD fragmentMap, update campaign) |

All new files follow existing Aira patterns:
- API client follows the same `APIClient` pattern as `iris/`, `arya/`, `intouch_api/`
- MCP tools follow the same `@mcp_server.tool()` pattern as existing tools
- RBAC follows the same `check_*_access()` pattern
- Playbook follows the same `NAME + DESCRIPTION + PROMPT` pattern

---

## Summary: What's in CustomerGlu repos vs. new code

| Component | In CustomerGlu repos | New (to be merged) |
|---|---|---|
| Campaign CRUD API | ✅ Existing (`campaign.controller.js`) | Internal routes (`internal.route.js`) call the SAME controllers |
| FragmentMap CRUD API | ✅ Existing (`campaign.controller.js`) | Internal routes reuse the SAME controllers |
| Layout save + cache warm | ✅ Existing (`rewardCacheInvalidation.js`) | No change — internal routes trigger the same cache warm |
| Auth middleware | ✅ Existing (`authentication.js`, `jwt.js`) | `authenticateByApiKey` added for service-to-service (follows existing `setClient` pattern) |
| Campaign model | ✅ Existing (`campaign.model.js`) | No model changes |
| FragmentMap model | ✅ Existing (in `@customerglu/central-schema`) | No model changes |
| Editor frontend | ⚠️ Existing Preact-Dashboard (source not available locally) | New React dashboard — can be merged into Preact-Dashboard or deployed alongside |
| Aira integration | ❌ Did not exist | New MCP tools + playbook (follows existing Aira patterns) |
| Element schema | ❌ Did not exist | New (`elementSchema.js`) — defines validation rules that should also be added to backend |
| Preview renderer | ⚠️ Existing in Constellation app | New local renderer for editing — Constellation remains the production renderer |

**Key point:** We did NOT rebuild CustomerGlu's backend. We added 1 new route file (210 lines) and 2 lines to the index. Everything else is new frontend + Aira integration code that calls the EXISTING backend through the same controller methods.
