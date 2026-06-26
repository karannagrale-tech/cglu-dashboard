/**
 * Internal / Service-to-Service API Routes
 *
 * These routes use x-api-key (writeKey) authentication instead of Auth0 JWT.
 * Designed for machine-to-machine integrations like Aira AI assistant.
 *
 * Auth flow:
 *   1. Request includes `x-api-key` header with the client's writeKey
 *   2. `setClient` middleware looks up the Client by apiKey
 *   3. Client's `clientId` is set on `req.body.client`
 *   4. `verifyInternalAuth` validates the x-api-key against a shared secret
 *
 * Mount: /campaigns/v1/internal/
 */

const express = require("express");
const router = express.Router();
const campaign = require("../../controllers/campaign.controller");
const logger = require("../../../config/logger");
const { Client } = require("@customerglu/central-schema/src/controller/profile");

/**
 * Middleware: Authenticate using x-api-key header.
 * Looks up the Client by apiKey and sets req.body.client.
 */
const authenticateByApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "Missing x-api-key header",
      });
    }

    const clientData = await Client.findOne({ apiKey }).lean();
    if (!clientData) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    req.body.client = clientData.clientId;
    req.body.clientData = clientData;
    req.body.timeZone = clientData.timezone;
    next();
  } catch (error) {
    logger.error("[Internal] Auth failed:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

/**
 * Middleware: Verify internal service secret.
 * Requires x-internal-secret header matching INTERNAL_API_SECRET env var.
 * This prevents external callers from using the internal routes even if they have a writeKey.
 */
const verifyInternalSecret = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  // If no secret is configured, allow all requests (dev mode)
  if (!expectedSecret) {
    return next();
  }

  if (!secret || secret !== expectedSecret) {
    return res.status(403).json({
      success: false,
      message: "Invalid internal secret",
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(verifyInternalSecret);
router.use(authenticateByApiKey);

// ─────────────────────────────────────────────
// Campaign Routes
// ─────────────────────────────────────────────

/**
 * GET /internal/campaigns/list
 * List all campaigns for the authenticated client.
 */
router.get("/campaigns/list", async (req, res, next) => {
  try {
    req.body.client = req.body.client; // already set by middleware
    return campaign.list(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /internal/campaigns/new
 * Create a new campaign.
 */
router.post("/campaigns/new", async (req, res, next) => {
  try {
    return campaign.createCampaign(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /internal/campaigns/:campaignId
 * Get a single campaign with its layout.
 */
router.get("/campaigns/:campaignId", async (req, res, next) => {
  try {
    return campaign.get(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /internal/campaigns/:campaignId
 * Update campaign settings.
 */
router.patch("/campaigns/:campaignId", async (req, res, next) => {
  try {
    return campaign.updateCampaign(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// Layout Routes
// ─────────────────────────────────────────────

/**
 * POST /internal/layout
 * Upsert (create or update) a ProgramLayout for a campaign.
 */
router.post("/layout", async (req, res, next) => {
  try {
    return campaign.upsertLayoutObject(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /internal/layout
 * Delete a ProgramLayout.
 */
router.delete("/layout", async (req, res, next) => {
  try {
    return campaign.deleteLayoutObject(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// FragmentMap Routes
// ─────────────────────────────────────────────

/**
 * POST /internal/fragmentmap/add
 * Create a new fragment map.
 */
router.post("/fragmentmap/add", async (req, res, next) => {
  try {
    return campaign.createFragmentMap(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /internal/fragmentmap/:fragmentMapId
 * Get a fragment map by ID.
 */
router.get("/fragmentmap/:fragmentMapId", async (req, res, next) => {
  try {
    req.body.fragmentMapId = req.params.fragmentMapId;
    return campaign.getFragmentMap(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /internal/fragmentmap/:fragmentMapId
 * Update a fragment map.
 */
router.patch("/fragmentmap/:fragmentMapId", async (req, res, next) => {
  try {
    req.body.fragmentMapId = req.params.fragmentMapId;
    return campaign.updateFragmentMap(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// Theme Routes
// ─────────────────────────────────────────────

/**
 * GET /internal/theme
 * Get theme configuration.
 */
router.get("/theme", async (req, res, next) => {
  try {
    return campaign.getThemeConfig(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /internal/theme
 * Save theme configuration.
 */
router.post("/theme", async (req, res, next) => {
  try {
    return campaign.saveThemeConfig(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /internal/theme/fonts
 * Get available fonts.
 */
router.get("/theme/fonts", async (req, res, next) => {
  try {
    return campaign.getFonts(req, res, next);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
