const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const ctrl = require("../controllers/adminDashboardController");

router.use(protect);
router.get("/", ctrl.getDashboardState);
router.post("/", authorize("super_admin", "admin"), ctrl.saveDashboardState);

module.exports = router;
