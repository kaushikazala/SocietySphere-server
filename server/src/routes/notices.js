const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/noticeController");

router.use(protect);

router.get("/", ctrl.getNotices);
router.post("/", authorize("admin", "super_admin"), ctrl.createNotice);
router.patch("/:id/read", ctrl.markRead);
router.delete("/:id", authorize("admin", "super_admin"), ctrl.deleteNotice);

module.exports = router;