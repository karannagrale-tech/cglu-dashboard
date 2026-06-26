# Layout Editor Audit -- CustomerGlu

> Audit date: 2026-06-24
> Scope: layout editor UI, data model, preview pipeline, save/publish path, validation, bugs, and shared vocabulary proposal.

---

## 1. Layout Editor UI -- Files, Components, Framework

### Frameworks

| Environment | Stack | Notes |
|---|---|---|
| **Production** (`app-me.customerglu.com`) | Preact (TypeScript), Context API, @testing-library/preact, Cypress E2E | Dev server on port 4200 |
| **Local replica** (`/Users/karannagrale/workarea/cglu-dashboard`) | React 18 (JavaScript/JSX), React Router DOM, Vite | No TypeScript, plain JSX |

### Key Files

| File | Lines | Purpose |
|---|---|---|
| `src/pages/LayoutEditor.jsx` | 1538 | Main editor page. Three-panel layout (structure tree, preview, node editor). Owns all top-level state: campaign data, `fragmentMapRaw`, `workingById`, undo/redo stacks, selected node, saving state. Defines inline `GameStructureTree`, `GameTreeNode`, and `GameNodeEditor` components plus helpers (`buildTreeFromGame`, `gameByIdToTree`, `deepClone`, `useHistory`). |
| `src/components/StructureTree.jsx` | 268 | Reusable structure tree. Exports `buildTreeFromByIdMap`, `flattenByIdMap`, and `StructureTree`/`TreeNode`. Handles search, expand/collapse, node selection. **Not fully used** -- `LayoutEditor.jsx` duplicates most of this logic inline. |
| `src/components/PreviewPanel.jsx` | 304 | Device-frame preview (mobile/tablet/desktop toggle). Renders an iframe inside a phone/tablet/desktop frame with notch, home bar, loading overlay. **Not imported by LayoutEditor** -- the editor has its own inline 375x720 phone preview. |
| `src/components/NodeEditor.jsx` | 836 | Standalone node editor with 4 tabs (UI, Logic, Nudges, Rewards). Content fields, CSS sections with color pickers, style template presets, JSON edit mode, per-node save. **Not imported by LayoutEditor** -- duplicated inline as `GameNodeEditor`. |
| `src/components/AskAiraPanel.jsx` | 621 | AI assistant chat panel. Local NLP command parser (`parseCommand`) for theme changes, color, text, size, visibility, images, rewards. Applies changes via `applyPatches` to fragmentMap. Image upload, contextual suggestions. **This IS imported and used by LayoutEditor.** |
| `src/components/StatusBadge.jsx` | 113 | Campaign status badge with colored styling. |
| `src/App.jsx` | 173 | Root app with React Router. Routes: `/` CampaignList, `/campaign/:id` CampaignDetail, `/create` CreateCampaign, `/editor/:campaignId` LayoutEditor. Top nav with CustomerGlu branding. |
| `src/api/cglu.js` | 94 | API client. Campaigns CRUD, fragmentMap CRUD, theme config, preview link (via Paint-API), Aira chat. Uses `x-api-key` auth header. Env vars: `VITE_CGLU_API_HOST`, `VITE_PAINT_API_HOST`, `VITE_AIRA_HOST`. |
| `src/constants/defaultFragmentMaps.js` | 381 | Default fragmentMap templates for scratch card, spin wheel, quiz. Used when a campaign has no fragmentMap yet. |
| `src/constants/gameTypes.js` | 58 | Constants: `GAME_TYPES` (18 types with icons), `GAME_CATEGORIES`, `REWARD_STATES` (4 states), `NODE_LABELS` (human-readable labels for node IDs). |
| `src/main.jsx` | 13 | Vite entry point. `BrowserRouter` + `StrictMode`. |

### Component Hierarchy

```
LayoutEditor (src/pages/LayoutEditor.jsx)
|
+-- TopToolbar (inline JSX)
|     Back button, title, campaign selector, undo/redo/delete buttons
|
+-- LeftPanel: GameStructureTree (inline, lines 113-228)
|     Tabs (Game / Banner), action buttons (Edit JSON, Theme, Reset), search input
|     |
|     +-- GameTreeNode (inline recursive, lines 230-314)
|           Expand/collapse toggle, monospace nodeId, depth indentation, search filtering
|
+-- CenterPanel: Inline Preview (NOT PreviewPanel.jsx)
|     375x720 phone frame with notch and home indicator, iframe with campaign URL
|
+-- RightPanel
|     |
|     +-- GameNodeEditor (inline, lines 318-853)
|     |     Node header, 4 tabs (UI/Logic/Nudges/Rewards), style template dropdown,
|     |     recursive renderFields for content and CSS, JSON editor modal, save button
|     |
|     +-- AskAiraPanel (imported from src/components/AskAiraPanel.jsx)
|           Chat interface, local NLP parser, theme presets, contextual suggestions
|
+-- FullJsonOverlay (inline modal, lines 1497-1533)
      Edit entire fragmentMap JSON in textarea
```

**Important:** `LayoutEditor.jsx` defines `GameStructureTree`, `GameTreeNode`, and `GameNodeEditor` as **inline components** rather than importing the standalone `StructureTree.jsx` and `NodeEditor.jsx`. Only `AskAiraPanel` is used as an imported component. This duplication is a significant maintenance risk.

### State Management

**Approach:** `useState` only. No Redux, no Context, no external state library.

**There is no single source of truth.** Two parallel state holders exist:

| State Variable | Location | Type | Role |
|---|---|---|---|
| `workingById` | Line 875 | `useState(null)` | The mutable working copy of `game.byId`. Primary editing state. Deep clone of `fragmentMapRaw.fragments.reward.game.byId`. All node edits mutate this via `handleUpdateNode` which does `setWorkingById(prev => ({...prev, [nodeId]: updatedNodeData}))`. |
| `fragmentMapRaw` | Line 862 | `useState(null)` | Full fragmentMap from the API. Updated only on save (`handleSave`) or when AskAiraPanel makes changes (`handleAiraChange`). Serves as the "last saved" reference. |

**Derived state:**
- `game` -- `useMemo` extracting `fragmentMapRaw.fragments.reward.game`
- `workingGame` -- `useMemo` combining `game` with `workingById` overlay (what `GameStructureTree` receives)

**Undo/Redo:** Manual stacks (`undoStack`, `redoStack`) of deep-cloned `workingById` snapshots (lines 878-880 state, 978-992 handlers). An unused `useHistory` hook at lines 68-109 exists but is never called.

**Data flow:**

```
API --> fragmentMapRaw --> game (derived) --> workingById (clone)
                                                   |
                                              edits happen here
                                                   |
                                              Save writes workingById back into
                                              fragmentMapRaw clone and PATCHes API
```

**Two divergent editing paths:**
1. `GameNodeEditor` edits `workingById` directly (no auto-save, user must click "Save Changes")
2. `AskAiraPanel` receives `fragmentMapRaw`, calls `onFragmentMapChange` which triggers `handleAiraChange`, which updates `workingById` AND auto-saves to API

### Structure Tree

**Data structure:** Flat `byId` map (dictionary):
```js
{
  [nodeId: string]: {
    type_id: string,
    ui: {
      content: { children?: string[], text?: string, ... },
      css: { container?: {...}, text?: {...}, button?: {...} }
    }
  }
}
```

- Root node: `ROOT` key in `byId`, or `game.rootId` (defaults to `'ROOT'`)
- Child relationship: `node.ui.content.children` is an array of node ID strings

**Tree building:** `buildTreeFromGame` (lines 28-52) starts at ROOT, recursively resolves `byId[id].ui.content.children`, returns tree nodes with `{ id, nodeId, type_id, ui, content, css, style, children, _raw }`.

**Rendering:** `GameTreeNode` (lines 230-314) is recursive. Shows nodeId in monospace with `'{ ... }'` hint. Indented by `depth*16px`. Auto-expands nodes at `depth < 3`. Supports search filtering on nodeId or type_id. Shows raw node IDs, not human-readable labels (unlike standalone `StructureTree.jsx` which uses `NODE_LABELS`).

### Node Editor

**Editable properties (UI tab):**

| Section | Fields | Input Types |
|---|---|---|
| Content (`node.ui.content`) | `text`, `children` (array), `coverColor`, `coverText`, `coverImage`, `slices` (array of objects), `spinButtonText`, `pointerColor`, `questions` (array), `label`, `placeholder`, `items` (array) | String inputs, array editors with drag/duplicate/move/delete, recursive field rendering |
| CSS (`node.ui.css`) | `backgroundColor`, `color`, `fontSize`, `fontWeight`, `margin`, `padding`, `borderRadius`, `backgroundImage`, `backgroundSize`, `backgroundPosition`, plus any nested CSS objects | Color pickers + text inputs, collapsible sections for nested objects |
| `type_id` | Displayed read-only with edit icon | Not editable in UI |
| Style templates | Default, Dark, Festive, Minimal | Dropdown (selection mechanism exists but no apply logic in inline `GameNodeEditor`) |

**Other tabs:** Logic, Nudges, and Rewards tabs are all placeholders with message text only.

**Change propagation:** `handleFieldChange(path, value)` (line 361-370) deep clones the node, walks the path array, sets the value, calls `onUpdateNode(nodeId, updatedNodeData)`. `onUpdateNode` (line 969-976) pushes current `workingById` to undoStack, clears redoStack, sets `workingById[nodeId] = updatedNodeData`.

**Saving:** Explicit -- user clicks "Save Changes". `handleSave()` deep clones `fragmentMapRaw`, replaces `frags.reward.game.byId` with `workingById`, calls `updateFragmentMap` API, updates `fragmentMapRaw` state, refreshes preview.

**JSON editing:** Per-node JSON editor modal (Edit JSON button) and full fragmentMap JSON editor via "Edit Full JSON" in the structure tree panel.

---

## 2. Layout Config Storage -- JSON Schema per Game Type

### Campaign Schema Relationship

The Campaign model (`campaign.model.js`) stores experience/game config in two locations:

**Top-level fields (line ~628):**

| Field | Type | Values |
|---|---|---|
| `experience` | String enum | See experience types table below |
| `type` | String enum | `direct`, `product`, `uidirect`, `uistep`, `uisteprecipe`, `uisteptier` |
| `offerUI` | Mixed (schema-less) | Scratch card / spin wheel presentation data |
| `banner` | Mixed | Banner configuration |
| `handledBy` | String enum | `marax`, `client` |
| `rewardValid` | Number | Reward validity in hours |
| `interactionStatus` | String enum | `pristine`, `clicked`, `completed`, `in-progress` |

**`rewardTemplateConfig` (line ~324):**

| Field | Type |
|---|---|
| `experience` | String enum (same list) |
| `hasIntro` | Boolean |
| `rules` | [String] |
| `introIcon` | String |
| `backgroundColor` | String |
| `cardTitle` | String |
| `pageTitle` | String |
| `cardBackgroundImage` | String |
| `bannerImage` | String |
| `pageSubtitle` | String |
| `confettiIcon` | String |
| `startButton` | `{ name: String, timeLimit: Number }` |

**The `fragmentMap` field is NOT on the Campaign model.** It is a separate MongoDB collection (`V3.fragmentmaps`) accessed via the `FragmentMap` model from `@customerglu/central-schema`. A campaign references a fragmentMap by its `_id`.

### Experience Types

| Value | Description |
|---|---|
| `spinthewheel` | Spin the Wheel game |
| `scratchcard` | Scratch Card game |
| `direct` | Direct reward (no game) |
| `slotmachine` | Slot Machine game |
| `quiz` | Quiz game |
| `memorygame` | Memory/Card-matching game |
| `referral` | Referral program |
| `multistep` | Multi-step campaign (streak-like) |
| `streak` | Streak/daily-check-in |
| `activity-scratchcard` | Activity-gated scratch card |
| `collectthestamps` | Stamp collection game |
| `giftbox` | Gift box reveal (`rewardTemplateConfig` only) |
| `gamechallenge` | Game challenge (top-level only) |
| `flappy-bird` | Flappy Bird mini-game |
| `word-scramble` | Word Scramble game |
| `balloon-pop` | Balloon Pop game |
| `color-match` | Color Match game |
| `whack-a-mole` | Whack-a-Mole game |
| `picture-puzzle` | Picture Puzzle game |

### Per-Game Config in rewardTemplateConfig

**Scratch Card:**
```json
{
  "backgroudColor": "String (note: typo is in the actual schema)",
  "backgroundImage": "String"
}
```

**Spin the Wheel:**
```json
{
  "slices": [{
    "label": "String",
    "backgroundColor": "String",
    "textColor": "String",
    "image": "String",
    "description": "String"
  }]
}
```

**Slot Machine:**
```json
{
  "reelCount": "Number (default: 3)",
  "slotImages": ["String"],
  "backgroundImage": "String",
  "backgroundOrigin": { "x": "String", "y": "String" }
}
```

**Memory Game:**
```json
{
  "rowCount": "Number",
  "columnCount": "Number",
  "backgroundImage": "String",
  "cardCover": "String",
  "cardSymbols": ["String"],
  "instructions": ["String"],
  "timeLimit": "Number (seconds)",
  "lost": "Boolean (default: false)",
  "timeLeft": "Number"
}
```

**Quiz (nested in rewards array):**
```json
{
  "count": "Number",
  "minWinScore": "Number",
  "questions": [{
    "question": "String",
    "image": "String",
    "description": "String",
    "options": ["String"],
    "optionScores": ["Number"],
    "answer": "String",
    "time": "Number"
  }],
  "winState": { "title": "String" }
}
```

### FragmentMap Structure (Full)

The `fragmentmaps` collection stores the full UI layout tree. MongoDB collection: `V3.fragmentmaps`.

```json
{
  "_id": "ObjectId",
  "client": "String (client UUID)",
  "fragmentKeys": ["version", "reward", "program"],
  "fragmentType": "String (e.g. 'MULTI_STEP', 'SINGLE_REWARD')",
  "useAsTemplate": "Boolean",
  "hidden": "Mixed",
  "reportingVersion": "Mixed",
  "createdAt": "Date",
  "updatedAt": "Date",

  "fragments": {
    "fragmentVersion": "Number (e.g. 0)",
    "templateVersion": "Number (e.g. 0)",
    "reward": {
      "type_id": "String (e.g. 'SCRATCH_CARD')",
      "intro": "null | Object",
      "banner": "NodeTree (banner section)",
      "rewardCard": "NodeTree (reward card section)",
      "reward": "null | Object",
      "game": "NodeTree (THE MAIN GAME LAYOUT)",
      "data": "Mixed",
      "ui": "Mixed"
    },
    "program": "Mixed (program-level fragment)"
  },

  "data": {
    "activityIdMap": "Object (maps activity UUIDs to reward arrays)",
    "slots": "null | Object (slot configuration)"
  },

  "theme": {
    "id": "null | String",
    "version": "String (e.g. '1')",
    "fonts": {
      "primaryFont": { "family": "", "type": "", "url": "", "variable": "" },
      "secondaryFont": { "family": "", "type": "", "url": "", "variable": "" }
    },
    "paletteVariables": {
      "light": { "default": { "--Accent": "", "--B1": "", "--B2": "", "--P1": "", "--S1": "" }, "custom": {} },
      "dark": { "default": {}, "custom": {} }
    },
    "otherVariables": { "--button-radius": "", "--button-size": "" },
    "deviceVariables": {
      "laptop": { "--body": "", "--body-highlight": "", "--button": "" }
    }
  }
}
```

### NodeTree Structure

Used by `banner`, `rewardCard`, and `game`:

```json
{
  "rootId": "String (e.g. 'ROOT')",
  "byId": { "[nodeId]": "NodeObject" },
  "interstitailData": "Mixed (note: typo is in codebase)",
  "placement": {
    "wallId": ["String"],
    "order": "Number"
  }
}
```

`placement` appears only on `banner` and `rewardCard`, not on `game`.

### Node Anatomy

Every node in `byId`:

```json
{
  "type_id": "String",
  "ui": {
    "content": "Object (type-specific content)",
    "css": "Object (type-specific CSS styles)"
  }
}
```

### Observed Node Types

| `type_id` | `ui.content` keys | `ui.css` keys |
|---|---|---|
| `SCRATCH_CARD_ROOT_1` | `children: [nodeId, ...]` | `container: { textAlign, padding, backgroundImage }` |
| `TEXT` | `text: String` | `text: { fontSize, lineHeight, fontWeight, color, margin }` |
| `IMAGE` | `src: String` | `image: { display, margin }` |
| `SCRATCH_CARD_GAME_1` | `cardCover: String, youWon: String, rewardCard: nodeId` | `card: { borderRadius, overflow, border }` |
| `REWARD_BUTTON` | `(empty or text)` | `button: { backgroundColor, maxWidth, display, margin, boxShadow, color, borderRadius, marginTop }` |
| `CONDITIONAL_WRAPPER` | `properties: [String], map: { "false": [nodeId], "true": [nodeId] }` | `container: null` |
| `PLANE_BANNER` | `children: [nodeId]` | (none observed) |
| `REWARD_CARD_ROOT_1` | `children: [nodeId]` | (none observed) |
| `REWARD_CARD_1` | `couponCode: nodeId, iconBackground: String` | (none observed) |
| `CARD_CODE` | `iconColor: String` | (none observed) |

### Observed Node IDs (Scratch Card Game Tree)

`ROOT`, `IMG_1`, `CONDITIONAL`, `CONDITIONAL_2`, `TEXT_1`, `TEXT_2`, `TEXT_HINT`, `SC`, `CC`, `RC`, `ANIME_BLOCK`, `EXPIRY`, `EXPIRY_DATE`, `TNC`, `CTA`, `REWARD_BODY`

### Key Data Paths

| What | Path |
|---|---|
| Layout nodes | `fragmentMap.fragments.reward.game.byId` |
| Root node | `fragmentMap.fragments.reward.game.byId.ROOT` |
| Program layout | `fragmentMap.fragments.program.programLayout` |
| Reward slots | `fragmentMap.data.slots` |
| Activity map | `fragmentMap.data.activityIdMap` |

### data.activityIdMap Structure

Maps activity UUIDs to arrays of reward objects:

```json
{
  "a1b2c3d4-...": [{
    "reward": {
      "title": "You've won Flat 7% off",
      "body": "String",
      "icon": "https://...reward-icon.svg",
      "getCouponFromBackend": true,
      "code": "FLAT7OFF",
      "tnc": ["Valid on orders above Rs. 500"],
      "cta": {
        "target": "STORE",
        "name": "Back",
        "action": {
          "store": "ROUTER",
          "type": "ROUTER_STORE POP PAGE START"
        },
        "isCommonCta": true
      },
      "emoji": null,
      "type": "CASHBACK"
    }
  }],
  "empty-activity-id": []
}
```

Empty activity IDs map to `[]` (no reward / losing outcome).

### Immutability Rules

1. Always deep clone (`JSON.parse(JSON.stringify())`) before mutating
2. When changing streak length, update both `program.programLayout` and `reward.game`
3. Do not modify `data.slots` when adding/cloning/deleting activities in game challenges
4. Use defensive null/undefined checks on deeply nested properties

---

## 3. Preview Data Path

### Preview URL Generation

Three routes in Paint-Api (`Paint-Api/src/api/routes/v1/paint.route.js`):

| Method | Route | Controller | Purpose |
|---|---|---|---|
| POST | `/campaigns/:campaignId/previewLink` | `paintController.previewLink` (line 94) | Primary preview link generator used by dashboard |
| GET | `/campaigns/:campaignId/previewLink` | `paintController.temporaryPreviewLinkCreator` (line 88) | Returns cached preview link if one exists |
| POST | `/elevatedPreview/resources` | `paintController.getElevatedPreviewResources` (line 98-104) | Returns campaign + layout data for in-editor preview (no URL generation) |

**Step-by-step preview link generation** (`generatePreviewLink` helper, line 4254):

1. **Create a synthetic preview user** -- registers a temporary user with userId `glutest-preview-{clientName}-{timestamp}` (or `glutest-anonymousUser-preview-...`). Calls `apiEndpoint + "/user/v1/user/sdk?token=true"` which returns a **JWT token**.

2. **Mark user as dashboard user** -- sets `userDoc.isDashboardUser = true` (line 4317). Code at lines 6089-6100 skips A/B experiment bucketing and controlPercentage checks for dashboard users, ensuring preview always shows the campaign.

3. **Create user program objects** -- calls `createSingleUserObjectsHelper2` to create reward/program state for the preview user.

4. **Generate the URL** -- two URL generators:
   - `getUrlDynamic(token, client, campaignId, urlObj)` (line 7190): `{frontendBaseUrl}/program/?token={jwt}&campaignId={campaignId}`
   - `getUrlDynamicRewardUser(token, client, rewardUserId, urlObj, campaignId)` (line 7331): `{frontendBaseUrl}/reward/?token={jwt}&rewardUserId={rewardUserId}` -- used for game-type experiences (spinthewheel, scratchcard, quiz, etc.)

5. **Append `&skipSeen=true`** -- final URL: `{campaignUrl}&skipSeen=true` (line 4581).

6. **Cache the link on the Campaign document** -- `Campaign.findOneAndUpdate({ campaignId }, { previewLink: previewUrl })` (line 4582-4584). Persists in MongoDB.

### How Constellation Renders the Game

The preview URL points to the **Constellation app**, a separate frontend application. Per-client routing via `.env`:

```
FRONTEND_URL_MAP={
  "default": "https://constellation-me.customerglu.com",
  "b2d11ed1-...": "https://pml-constellation-staging.customerglu.com",
  "53e85ec8-...": "https://pml-constellation.customerglu.com",
  "c98d5a04-...": "https://constellation.customerglu.com"
}
```

`getFrontendUrl(client)` resolves `frontendUrlMap[client] || frontendUrlMap.default`.

### Where It Gets Layout Data From

The preview does NOT embed layout data in the URL. Data is fetched at runtime:

1. Constellation app loads with JWT token from URL query parameter.
2. Calls Paint-Api `GET /user/:campaignId` (`getSingleCampaign`, line 1401) with JWT in Authorization header.
3. `getSingleCampaign` fetches: campaign details, user segments, detailed schedule, banner data, user program objects.
4. For layout data: if campaign has a `fragmentMap`, it is populated via `.populate("fragmentMap")`. Otherwise `ProgramLayoutModel` is queried via `getProgramLayout(client, campaignId)`.
5. `POST /fragmentmap/:fragmentMapId` (line 122-123) is also available for constellation to fetch fragment maps independently.

**Elevated preview** (`getElevatedPreviewResources`, line 10641) takes a different path:
- With `templateId`: fetches template, returns dummy-initialized campaign+layout objects (no user creation)
- With `campaignId`: fetches Campaign with `.populate("fragmentMap")` and ProgramLayout, wraps in `initializeDummyObjects()`
- Neither: returns wallet URL

### How Re-rendering Works (or Doesn't)

**The preview does NOT update live.** To see changes:

1. Save layout changes (writes to MongoDB)
2. Wait for Redis cache TTL to expire (up to 5 minutes), OR cache needs manual invalidation
3. Reload the preview URL in the browser (constellation re-fetches on load)

The elevated preview path reads directly from MongoDB with `.populate("fragmentMap")` and does NOT appear to use Redis caching, so editor-embedded previews may be fresher than constellation URL previews.

### Caching Layers

| Layer | Key Pattern | TTL | Invalidation |
|---|---|---|---|
| **Redis: FragmentMap** | `FragmentMap:${fragmentMapId}:all` | 300s (5 min) | Warmed on fragmentMap save; no explicit invalidation on layout update endpoints |
| **Redis: ProgramLayout** | `ProgramLayout:${client}:${campaignArray}` | 300s | Warmed on layout save |
| **Redis: Campaign** | `Campaign:${client}:${campaignId}:${type}` | 300s | Invalidated + warmed on campaign update |
| **Redis: SDK config** | `sdkConfigRedisPrefix + client` | Varies | Stores whitelisted domains |
| **MongoDB: previewLink** | Stored on Campaign document | Indefinite | Overwritten only when regenerated |
| **CDN** | EntryPoints, SDK config URLs | Varies | Purged via `purge.js` child process on campaign update |
| **iframe** | Browser cache | Session | Requires key-prop change or manual reload |

---

## 4. Save/Publish Path

### FragmentMap Save

**Route:** `PATCH /fragmentmap/:fragmentMapId`
**File:** `Campaigns-API/src/api/routes/v1/campaign.route.js` line 343-344
**Middleware:** `authenticate -> checkJwt -> addClientToBody -> editorOrAdmin -> controller.updateFragmentMap`

**Controller:** `campaign.controller.js` line 2264-2333 (`updateFragmentMap`)

1. `router.param("fragmentMapId")` calls `setfragmentMapId` (line 463) -- copies fragmentMapId from URL params to `req.body.fragmentMapId`
2. Looks up campaign referencing this fragmentMap: `Campaign.findOne({ fragmentMap: fragmentMapId })`
3. Looks up client data, sets `reportingVersion` if applicable
4. Generates `analyticsMeta` via `getAnalyticsMetadata()`
5. Whitelists URLs found in body via `addDomainsToWhitelistedDomains()`
6. **DB write:** `FragmentMap.findOneAndUpdate({ _id: fragmentMapId, client }, req.body, { new: true })` (line 2302)
7. If not found, returns 400
8. **Cache warm:** `rewardCacheInvalidation.warmFragmentMapCache(fragmentMapId)` (line 2319) -- sets Redis key `FragmentMap:${fragmentMapId}:all` with TTL 300s
9. Returns `{ success: true, data: fragmentMapObj }`

### Layout Save

**Route:** `POST /layout`
**File:** `campaign.route.js` line 84-85
**Middleware:** `authenticate -> checkJwt -> addClientToBody -> editorOrAdmin -> controller.upsertLayoutObject`

**Controller:** `campaign.controller.js` line 2048-2104 (`upsertLayoutObject`)

1. Reads `campaignId` and `client` from request body
2. Looks up campaign and client, sets `reportingVersion`
3. Generates `analyticsMeta`, whitelists URLs
4. **DB write:** `ProgramLayoutModel.findOneAndUpdate({ client, campaignId }, req.body, { upsert: true, new: true, lean: true })` (line 2082)
5. **Cache warm:** `rewardCacheInvalidation.warmLayoutCache(campaignId, client)` (line 2090) -- sets `ProgramLayout:${client}:${campaignId}:rewardLayout` and `SingleProgramLayout:${client}:${campaignId}`, TTL 300s

### Campaign Update (Publish)

**Route:** `PATCH /:campaignId`
**File:** `campaign.route.js` line 160-167
**Middleware:** `authenticate -> checkJwt -> addClientToBody -> editorOrAdmin -> validate(updateCampaign) -> controller.updateCampaign`

**Controller:** `campaign.controller.js` line 704-858 (`updateCampaign`)

1. Joi validation on body
2. Fetches campaign, merges request body
3. Processes global rewards
4. **DB write:** `Campaign.findOneAndUpdate({ campaignId, client }, campaignObj, { new: true }).populate("entryPointsList")` (line 763)
5. **Cache operations** (line 776-786): `Promise.all([invalidateCampaignCaches, warmCampaignCache])` -- invalidates `client:${clientId}:campaigns:*` and `client:${clientId}:schedules:*`, then warms Campaign, SingleCampaignDetails, plus layout and fragmentMap caches
6. Forks `purge.js` child process for CDN purge
7. Publishes `CAMPAIGN_UPDATED` event to Redis pub/sub

### Cache Flow Diagram

```
Save fragmentMap --> DB write (findOneAndUpdate)
                 --> warmFragmentMapCache()
                     --> SET FragmentMap:${id}:all  TTL=300s
                     --> Paint-API reads from this key on next request

Save layout      --> DB write (findOneAndUpdate)
                 --> warmLayoutCache()
                     --> SET ProgramLayout:${client}:${campaignId}:rewardLayout  TTL=300s
                     --> SET SingleProgramLayout:${client}:${campaignId}  TTL=300s

Update campaign  --> DB write
                 --> Promise.all([
                       invalidateCampaignCaches()  // DEL client:${id}:campaigns:*, schedules:*
                       warmCampaignCache()          // SET Campaign, SingleCampaignDetails,
                                                    //     DetailedSchedule, ProgramLayout, FragmentMap
                     ])
                 --> fork purge.js (CDN purge)
                 --> publish CAMPAIGN_UPDATED to Redis pub/sub
```

### Race Conditions

1. **No optimistic locking anywhere.** No `__v` version check, no `updatedAt` comparison, no CAS operation. `findOneAndUpdate` is atomic at the MongoDB document level, but two concurrent saves result in last-write-wins with no conflict detection. Two users editing the same fragmentMap will silently overwrite each other.

2. **No transaction wrapping.** The sequence DB-write -> cache-warm is not atomic. If the process crashes between the DB write and cache warm, the cache will be stale until TTL expires (300s) or another save triggers a warm.

3. **Parallel invalidate + warm.** Campaign update runs `invalidateCampaignCaches` and `warmCampaignCache` in `Promise.all` (line 776). If invalidation finishes first and deletes keys, but warm has not yet written new keys, a concurrent Paint-API read will miss cache and hit DB. Minor race causing cache miss spikes.

---

## 5. Validation

### What IS Validated

| Endpoint | Validation | Details |
|---|---|---|
| `PATCH /:campaignId` | Joi (via `validate(updateCampaign)`) | `name` max 128 chars, `status` enum (`draft/scheduled/running/stopped/completed/sunset`), `type` conditional on experience, `questions` for surveys |
| `PATCH /fragmentmap/:fragmentMapId` | **None** | Only `setfragmentMapId` param handler (line 463) verifying fragmentMapId is present in URL |
| `POST /layout` | **None** | No validation middleware in route chain at all |

### What Is NOT Validated (Gaps)

| Gap | Location | Impact |
|---|---|---|
| **FragmentMap update has zero body validation** | `campaign.route.js` line 344 | Any JSON body is passed directly to `findOneAndUpdate`. A buggy frontend could overwrite `_id`, `client`, `createdAt`, or any other field. No schema validation, no field whitelist, no sanitization. |
| **Layout upsert has zero body validation** | `campaign.route.js` line 85 | Same issue -- the entire `req.body` is passed to `findOneAndUpdate` with `upsert: true`. Could create garbage layouts. |
| **No validation that fragmentMapId belongs to the client** | `setfragmentMapId` param handler, line 463 | Only checks existence, not ownership. The `findOneAndUpdate` at line 2302 does filter by `{ _id: fragmentMapId, client }`, which provides some protection. |
| **Campaign update validation is minimal** | `campaign.validation.js` | Only validates `name`, `status`, `type`, `questions`. All other fields (slots, entryPointsList, audience, etc.) pass through unvalidated. |
| **No node type_id validation** | Nowhere in the stack | Any arbitrary string can be set as `type_id`. Constellation may fail silently if it encounters an unknown type. |
| **No CSS value validation** | Nowhere in the stack | Arbitrary CSS values (including potentially malicious content) can be injected into node `ui.css` properties. |
| **No content structure validation** | Nowhere in the stack | `children` arrays could reference non-existent node IDs, creating broken trees. |

### Where Schema Validation Should Be Added

1. **`PATCH /fragmentmap/:fragmentMapId`** -- Add Joi validation middleware to whitelist allowed top-level fields (`fragments`, `data`, `theme`, `fragmentType`, `fragmentKeys`) and reject unknown fields. Validate `fragments.reward.game.byId` node structure recursively.

2. **`POST /layout`** -- Add Joi validation middleware requiring `campaignId`, `client`, `layoutType`, and validating the layout body structure.

3. **Node structure validation** -- Add a shared validator that checks:
   - `type_id` is from a known enum
   - `ui.content.children` references only node IDs present in the same `byId` map
   - `ui.css` values are safe strings (no script injection)
   - Required fields per `type_id` are present

4. **Frontend validation in LayoutEditor.jsx** -- Add client-side validation before save to catch obvious errors (empty required fields, orphan children, circular references) before hitting the API.

---

## 6. Suspected Bugs

| # | Symptom | File / Location | Root Cause Hypothesis |
|---|---|---|---|
| 1 | **Preview doesn't update after saving layout changes** | `rewardCacheInvalidation.js` lines 324-354 (`warmLayoutCache`) | `warmLayoutCache` filters by `layoutType: 'rewardLayout'` (line 332). If the campaign uses a different layoutType or the layout was saved without a layoutType field, the cache warm finds nothing and skips silently (`logger.warn` at line 336, then `return { success: false }`). The preview reads stale cache for up to 300s. |
| 2 | **Preview doesn't update after saving fragmentMap** | `campaign.controller.js` lines 2317-2323 (`updateFragmentMap`, cache warm block) | The cache warm is in a try/catch that **swallows errors silently** (lines 2321-2323). If Redis is slow or connection drops, the warm fails, the user gets `{ success: true }` (line 2325), but Paint-API still serves stale cached data for up to 300s. The user has no indication the cache warm failed. |
| 3 | **Preview doesn't update after campaign edit** | `campaign.controller.js` lines 776-786 (`updateCampaign`, cache block) | `invalidateCampaignCaches` uses Redis SCAN to delete keys matching `client:${clientId}:campaigns:*`. But the warmed keys use a different pattern: `Campaign:${client}:${campaignId}:${type}`. The invalidation pattern does NOT match the warmed keys. If a stale `Campaign:` key exists from a previous warm cycle, it is never explicitly invalidated -- only overwritten. If the warm fails (caught at line 784), the old key persists until TTL. |
| 4 | **Preview won't load -- iframe shows blank/error** | `campaign.controller.js` lines 2068-2080 (URL whitelisting in `upsertLayoutObject`) | URL whitelisting reads `sdkConfigRedisPrefix + client` from Redis. If cache entry is missing/stale, `addDomainsToWhitelistedDomains` runs but never reads the existing whitelist to merge. The `compareArrays` check (line 2074) could fail if `whiteListedDomains` is undefined/null (not guarded). If whitelisting fails silently, the preview iframe's domain is not whitelisted and the SDK config rejects loading. |
| 5 | **Preview won't load -- API calls inside iframe fail with 401** | `campaign.route.js` middleware chain (`authenticate -> checkJwt`) | The preview iframe uses a JWT token that may expire during the editing session. There is no token refresh mechanism in the save path. If the token expires between last save and preview reload, the preview's API calls get 401s. |
| 6 | **Stale preview link with dead user token** | `campaign.controller.js` line 4582-4584 | The `previewLink` is cached on the Campaign document indefinitely (no TTL). If the synthetic preview user (`glutest-preview-...`) is cleaned up or the JWT expires, the cached link becomes non-functional. The POST endpoint reuses it without checking token validity. |
| 7 | **Preview cached with wrong anonymous user mode** | `campaign.controller.js` lines 4664-4669 | The controller checks if cached link's token has `anonymousId` when `generateAnonymousUser` is requested. But if an anonymous preview link is cached and a non-anonymous request comes in, the cached anonymous link is returned anyway (only checks the inverse case). |
| 8 | **Body pollution on fragmentMap save** | `campaign.controller.js` line 2302 | The entire `req.body` is passed as the update to `findOneAndUpdate`. The controller adds `fragmentMapId`, `reportingVersion`, and `analyticsMeta` to `req.body` (lines 2265-2288), but also passes through ANY other fields the frontend sends. No field whitelist or `$set` projection. If the frontend accidentally sends `_id` or `__v` or `client`, it causes silent data corruption or update failures. |
| 9 | **Dashboard user bypass is fragile** | `campaign.controller.js` line 4317 | `isDashboardUser = true` is set in-memory on a user document but not persisted. When constellation calls `getSingleCampaign`, it fetches the user fresh from MongoDB where `isDashboardUser` may not be set, causing A/B experiment or segment filtering to exclude the preview user. |
| 10 | **Elevated preview shows synthetic state** | `campaign.controller.js` line 10691 | The editor preview wraps data in `initializeDummyObjects()`, showing synthetic/placeholder reward states rather than actual user-facing states. This hides issues with real user state rendering. |
| 11 | **Dual editing paths cause data divergence** | `LayoutEditor.jsx` lines 969-976 vs AskAiraPanel integration | `GameNodeEditor` edits `workingById` only (requires manual save). `AskAiraPanel` edits and auto-saves to API. If a user makes changes in both without saving the node editor first, the Aira auto-save overwrites `fragmentMapRaw` without the pending `workingById` changes. |
| 12 | **Unused useHistory hook** | `LayoutEditor.jsx` lines 68-109 | A `useHistory` hook is defined but never called. The editor implements its own inline undo/redo. Dead code that may confuse maintainers. |
| 13 | **Style templates have no apply logic** | `LayoutEditor.jsx` inline `GameNodeEditor` | The style template dropdown (Default, Dark, Festive, Minimal) has a selection mechanism but no logic to actually apply the selected template to the node. Selecting a template does nothing. |
| 14 | **FRONTEND_URL_MAP per-client routing mismatch** | Paint-Api `.env` line 98 | If a client's constellation URL is misconfigured or missing, `getFrontendUrl` falls back to `frontendUrlMap.default` (constellation-me.customerglu.com). This causes cross-region preview rendering (e.g., US client previewing on ME cluster). |

---

## 7. Shared Element Vocabulary Proposal

### Common Element Types

These element types recur across all game types. Standardizing them enables a unified editor, shared validation, and consistent theming.

| Element Type | Description | Properties |
|---|---|---|
| **Background** | Root container for the entire experience | `backgroundImage: String`, `backgroundColor: String`, `backgroundSize: String`, `backgroundPosition: String`, `padding: String`, `textAlign: String`, `children: String[]` |
| **Image** | Static image element | `src: String (URL)`, `alt: String`, `css.image: { display, margin, width, height, objectFit }` |
| **Text** | Any text content -- title, subtitle, hint, expiry label | `text: String`, `css.text: { fontSize, lineHeight, fontWeight, color, margin, fontFamily, textAlign }` |
| **Button** | Call-to-action button | `text: String`, `action: { target, type, store }`, `css.button: { backgroundColor, color, borderRadius, maxWidth, margin, boxShadow, padding, fontWeight }` |
| **Container** | Generic layout wrapper, groups child elements | `children: String[]`, `css.container: { display, flexDirection, alignItems, justifyContent, gap, padding, margin }` |
| **ConditionalWrapper** | Shows/hides children based on state (win/lose, coupon exists, etc.) | `properties: String[]`, `map: { "true": String[], "false": String[] }`, `css.container: Object` |
| **RewardSlot** | Displays the reward outcome (reward body, icon, title) | `title: String`, `body: String`, `icon: String (URL)`, `emoji: String`, `type: String (CASHBACK, DISCOUNT, etc.)` |
| **CouponCode** | Coupon code display with copy-to-clipboard | `code: String`, `getCouponFromBackend: Boolean`, `iconColor: String`, `iconBackground: String` |
| **FormField** | Input field (used in coupon code entry, quiz answers) | `label: String`, `placeholder: String`, `type: String (text, number)`, `validation: Object` |
| **GameComponent** | The interactive game element itself (scratch area, wheel, quiz, etc.) | Game-type-specific (see per-game breakdown below) |
| **CountdownTimer** | Timer display for timed experiences | `timeLimit: Number (seconds)`, `css.timer: { fontSize, color, fontWeight }` |
| **TermsAndConditions** | T&C list display | `items: String[]`, `css.container: Object`, `css.text: Object` |
| **Animation** | Animation overlay (confetti, celebration) | `type: String`, `confettiIcon: String`, `duration: Number` |
| **ExpiryDisplay** | Shows reward expiry information | `text: String`, `dateFormat: String`, `css.text: Object` |

### GameComponent Specializations

| Game Type | GameComponent Variant | Additional Properties |
|---|---|---|
| Scratch Card | `ScratchArea` | `cardCover: String (color/image URL)`, `coverText: String`, `coverImage: String`, `youWon: String`, `rewardCard: String (nodeId reference)` |
| Spin the Wheel | `Wheel` | `slices: Array<{ label, backgroundColor, textColor, image, description }>`, `spinButtonText: String`, `pointerColor: String` |
| Quiz | `QuizEngine` | `questions: Array<{ question, image, description, options, optionScores, answer, time }>`, `count: Number`, `minWinScore: Number`, `winState: Object`, `loseState: Object` |
| Slot Machine | `SlotReels` | `reelCount: Number`, `slotImages: String[]`, `backgroundImage: String`, `backgroundOrigin: { x, y }` |
| Memory Game | `MemoryGrid` | `rowCount: Number`, `columnCount: Number`, `cardCover: String`, `cardSymbols: String[]`, `instructions: String[]`, `timeLimit: Number` |
| Stamp Collection | `StampGrid` | `totalStamps: Number`, `stampIcon: String`, `completedIcon: String` |

### Game Type Decomposition into Shared Elements

**Scratch Card:**
```
Background
  +-- Text (title, e.g. "Scratch to Win!")
  +-- Text (subtitle/hint, e.g. "Scratch the card below")
  +-- ConditionalWrapper (win/lose state)
  |     +-- [true]  Container (reward)
  |     |             +-- RewardSlot
  |     |             +-- CouponCode
  |     |             +-- ExpiryDisplay
  |     +-- [false] GameComponent:ScratchArea
  +-- Animation (celebration on reveal)
  +-- Button (CTA, e.g. "Shop Now")
  +-- TermsAndConditions
```

**Spin the Wheel:**
```
Background
  +-- Text (title, e.g. "Spin & Win!")
  +-- Text (subtitle, e.g. "Try your luck")
  +-- GameComponent:Wheel (slices, pointer, spin button)
  +-- ConditionalWrapper (pre-spin/post-spin)
  |     +-- [true]  Container (reward)
  |     |             +-- RewardSlot
  |     |             +-- CouponCode
  |     |             +-- ExpiryDisplay
  |     +-- [false] Text (spin instruction)
  +-- Animation (celebration on win)
  +-- Button (CTA)
  +-- TermsAndConditions
```

**Quiz:**
```
Background
  +-- Text (title, e.g. "Answer & Win!")
  +-- Text (subtitle)
  +-- GameComponent:QuizEngine (questions, options, timer per question)
  +-- CountdownTimer (optional per-question timer)
  +-- ConditionalWrapper (win/lose based on minWinScore)
  |     +-- [true]  Container (win state)
  |     |             +-- RewardSlot
  |     |             +-- CouponCode
  |     +-- [false] Container (lose state)
  |                   +-- Text (try again message)
  +-- Button (CTA)
  +-- TermsAndConditions
```

**Slot Machine:**
```
Background
  +-- Text (title)
  +-- Text (subtitle)
  +-- GameComponent:SlotReels (reelCount, slotImages)
  +-- Button (spin/pull lever)
  +-- ConditionalWrapper (win/lose)
  |     +-- [true]  Container (reward)
  |     |             +-- RewardSlot
  |     |             +-- CouponCode
  |     +-- [false] Text (try again)
  +-- Animation
  +-- TermsAndConditions
```

**Memory Game:**
```
Background
  +-- Text (title, e.g. "Match the Cards!")
  +-- Text (instructions)
  +-- CountdownTimer (timeLimit)
  +-- GameComponent:MemoryGrid (rows, columns, card symbols, cover)
  +-- ConditionalWrapper (win/lose based on timeLimit)
  |     +-- [true]  Container (reward)
  |     |             +-- RewardSlot
  |     |             +-- CouponCode
  |     +-- [false] Text (time's up message)
  +-- Button (CTA)
  +-- TermsAndConditions
```

**Direct Reward (no game):**
```
Background
  +-- Image (brand/reward image)
  +-- Text (title)
  +-- Text (subtitle/body)
  +-- Container (reward)
  |     +-- RewardSlot
  |     +-- CouponCode
  |     +-- ExpiryDisplay
  +-- Button (CTA)
  +-- TermsAndConditions
```

### Mapping Current type_id Values to Shared Vocabulary

| Current `type_id` | Proposed Shared Element | Notes |
|---|---|---|
| `SCRATCH_CARD_ROOT_1` | `Background` | Root container with backgroundImage |
| `TEXT` | `Text` | Direct mapping |
| `IMAGE` | `Image` | Direct mapping |
| `SCRATCH_CARD_GAME_1` | `GameComponent:ScratchArea` | Contains cardCover, youWon, rewardCard ref |
| `REWARD_BUTTON` | `Button` | CTA button with action |
| `CONDITIONAL_WRAPPER` | `ConditionalWrapper` | Direct mapping |
| `PLANE_BANNER` | `Container` | Generic container with children |
| `REWARD_CARD_ROOT_1` | `Container` | Reward display container |
| `REWARD_CARD_1` | `RewardSlot` + `CouponCode` | Currently combined; should split |
| `CARD_CODE` | `CouponCode` | Direct mapping |

This vocabulary enables building a unified node editor that renders the correct fields per element type, validates required properties, and provides consistent theming across all game types.

---

## 8. PM Review Notes (Phase 0 Gate)

**Reviewed by:** Product (Karan Nagrale)
**Date:** 2026-06-24

### Feedback

1. **Bugs list is incomplete.** The 14 bugs are what code investigation surfaced. Production will have more — the list should be treated as a living document updated as bugs are discovered during Phase 1-5 work.

2. **Shared element vocabulary is incomplete.** The 13 shared types cover only common elements. Each game type has unique elements that don't map cleanly to the shared vocabulary (game-specific animations, scoring UI, progress indicators, leaderboard components, referral flows, streak indicators, stamp grids, etc.). The vocabulary must be extensible: shared base types + per-game extensions. Do NOT assume 13 types cover everything.

3. **Preview is a hard requirement.** The end product must show a real, working, visually accurate preview. The reactive local renderer approach is approved, but it must render the actual game layout — not a simplified representation. If we can't render locally with full fidelity, keep the constellation iframe as a fallback but make it refresh reactively.

### Decision: Proceed to Phase 1

Approved to proceed with Phase 1 (single source of truth + reactive preview) with these constraints:
- MVP scope: Scratch Card, Spin the Wheel, Quiz (3 game types)
- Preview approach: Build local CSS renderer from fragmentMap state, with constellation iframe as fallback for unsupported game types
- The shared vocabulary must have an explicit extension mechanism for game-specific elements
