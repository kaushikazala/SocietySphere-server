const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const ctrl = require("../controllers/emergencyController");

router.use(protect);

router.post("/sos", ctrl.triggerSOS);
router.get("/", ctrl.getAlerts);
router.post("/:id/respond", ctrl.addResponse);
router.patch("/:id/resolve", authorize("admin", "super_admin"), ctrl.resolveAlert);

module.exports = router;