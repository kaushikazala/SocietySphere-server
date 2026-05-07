
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/complaintController");

router.use(protect);

router.get("/", ctrl.getComplaints);
router.post("/", authorize("resident"), ctrl.createComplaint);
router.get("/:id", ctrl.getComplaint);
router.patch("/:id/assign", authorize("admin", "super_admin"), ctrl.assignComplaint);
router.patch("/:id/status", authorize("admin", "maintenance"), ctrl.updateStatus);
router.post("/:id/thread", ctrl.addThreadMessage);
router.post("/:id/rate", authorize("resident"), ctrl.rateComplaint);

module.exports = router;