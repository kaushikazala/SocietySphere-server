const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/eventController");

router.use(protect);

router.get("/", ctrl.getEvents);
router.post("/", authorize("admin", "super_admin", "resident"), ctrl.createEvent);
router.get("/:id", ctrl.getEvent);
router.patch("/:id", authorize("admin", "super_admin"), ctrl.updateEvent);
router.post("/:id/rsvp", authorize("resident", "admin"), ctrl.rsvp);
router.post("/:id/poll/vote", ctrl.votePoll);

module.exports = router;