const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/visitorController");

router.use(protect);

router.get("/", ctrl.getVisitors);
router.post("/", authorize("resident"), ctrl.createVisitor);
router.post("/walk-in", authorize("guard"), ctrl.walkIn);
router.get("/scan/:token", authorize("guard", "admin"), ctrl.scanQR);
router.patch("/:id/entry", authorize("guard", "admin"), ctrl.logEntry);
router.patch("/:id/exit", authorize("guard", "admin"), ctrl.logExit);
router.patch("/:id/approve", authorize("resident"), ctrl.approveWalkIn);
router.patch("/:id/blacklist", authorize("admin", "super_admin"), ctrl.blacklist);

module.exports = router;