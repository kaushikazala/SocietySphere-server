const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/maintenanceController");

router.use(protect);

router.get("/bills", ctrl.getBills);
router.get("/bills/summary", authorize("admin", "super_admin"), ctrl.getSummary);
router.get("/bills/:id", ctrl.getBill);
router.post("/bills/generate", authorize("admin", "super_admin"), ctrl.generateBills);
router.post("/bills/:id/pay", ctrl.recordPayment);
router.patch("/bills/:id/waive", authorize("admin", "super_admin"), ctrl.waiveBill);

module.exports = router;