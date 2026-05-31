const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const ctrl = require("../controllers/noteController");

router.use(protect);

router.get("/", ctrl.getNotes);
router.post("/", ctrl.createNote);
router.put("/:id", ctrl.updateNote);
router.delete("/:id", ctrl.deleteNote);

module.exports = router;
