const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/forumController");

router.use(protect);

router.get("/", ctrl.getPosts);
router.post("/", ctrl.createPost);
router.get("/:id", ctrl.getPost);
router.post("/:id/replies", ctrl.addReply);
router.post("/:id/like", ctrl.likePost);
router.patch("/:id/moderate", authorize("admin", "super_admin"), ctrl.moderatePost);

module.exports = router;