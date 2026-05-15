const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const ctrl = require("../controllers/parkingController");

router.use(protect);

router.get("/slots", ctrl.getSlots);
router.post("/slots", authorize("admin", "super_admin"), ctrl.createSlot);
router.patch("/slots/:id/assign", authorize("admin", "super_admin"), ctrl.assignSlot);
router.post("/slots/visitor-request", authorize("resident"), ctrl.requestVisitorSlot);

router.get("/violations", authorize("admin", "super_admin", "guard"), ctrl.getViolations);
router.post("/violations", authorize("guard"), ctrl.reportViolation);

module.exports = router;