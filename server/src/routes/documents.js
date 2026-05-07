const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/documentController");

router.use(protect);

router.get("/", ctrl.getDocuments);
router.post("/", authorize("admin", "super_admin"), ctrl.uploadMiddleware, ctrl.uploadDocument);
router.delete("/:id", authorize("admin", "super_admin"), ctrl.deleteDocument);

module.exports = router;