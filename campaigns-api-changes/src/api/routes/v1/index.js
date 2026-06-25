const express = require("express");
const campaignRoutes = require("./campaign.route");
const integrationsRoutes = require("./integrations.route");
const campaignController = require("../../controllers/campaign.controller");
const validate = require("express-validation");
const { clientValidation } = require("../../validations/client.validation");
const themeRoutes = require("./theme.routes");
const formRoutes = require("./form.route");
const experimentRoutes = require("./experiment.route");
const rewardRoutes = require("./reward.route");
const agentRoutes = require("../agent.routes");
const internalRoutes = require("./internal.route");
const router = express.Router();

/**
 * GET v1/status
 */
router.get("/status", (req, res) =>
  res.json({
    success: true,
    data: {
      message: "All good. https://marax.ai",
    },
  })
);

/**
 * Load client when API with 'client' route parameter is hit
 */
router.param("client", campaignController.setClient);

router.use("/theme", themeRoutes);
router.use("/form", formRoutes);

router.use("/integration", integrationsRoutes);
router.use("/experiment", experimentRoutes);
router.use("/reward", rewardRoutes);
router.use("/agent", agentRoutes);
router.use("/internal", internalRoutes);
/**
 * Use campaigns middleware
 */
router.use("/:client/", validate(clientValidation), campaignRoutes);

// /**
//  * Use activity middleware
//  */
// router.use('/:client/activity', validate(clientValidation), activityRoutes);

// /**
//  * Use nudge middleware
//  */
// router.use('/:client/nudge', validate(clientValidation), nudgeRoutes);

// /**
//  * Use reward middleware
//  */
// router.use('/:client/reward', validate(clientValidation), rewardRoutes);

module.exports = router;
