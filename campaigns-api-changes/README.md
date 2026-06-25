# Campaigns-API Changes — Internal API Routes

## What to do

1. Copy `src/api/routes/v1/internal.route.js` into your Campaigns-API repo
2. In `src/api/routes/v1/index.js`, add these 2 lines:

```javascript
// After the other requires (around line 11):
const internalRoutes = require("./internal.route");

// Before the /:client/ route (around line 38):
router.use("/internal", internalRoutes);
```

3. Add env var (optional): `INTERNAL_API_SECRET=<any-shared-secret>`

## What this does

Adds 10 internal API routes at `/campaigns/v1/internal/*` that use `x-api-key` header authentication instead of Auth0 JWT. This enables the new layout editor dashboard to call the Campaigns-API directly.

All routes call the EXISTING controller methods — zero logic duplication.

## Routes added

| Method | Path | Controller |
|--------|------|------------|
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
