
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const ctrl = require("../controllers/complaintController");

router.use(protect);

router.get("/", ctrl.getComplaints);
router.post("/", authorize("resident", "admin", "maintenance", "super_admin"), ctrl.createComplaint);
router.get("/:id", ctrl.getComplaint);
router.patch("/:id", authorize("resident", "admin", "maintenance", "super_admin"), ctrl.updateComplaint);
router.patch("/:id/assign", authorize("admin", "super_admin"), ctrl.assignComplaint);
router.patch("/:id/status", authorize("admin", "maintenance"), ctrl.updateStatus);
router.post("/:id/thread", ctrl.addThreadMessage);
router.post("/:id/rate", authorize("resident"), ctrl.rateComplaint);
router.delete("/:id", authorize("resident", "admin", "maintenance", "super_admin"), ctrl.deleteComplaint);

module.exports = router;