const express = require("express");
const router = express.Router();
const { protect, authorize, sameSociety } = require("../middlewares/auth");
const ctrl = require("../controllers/societyController");

router.get("/code/:code", ctrl.getSocietyByCode); // public — used during signup

router.use(protect);

router.post("/", authorize("super_admin", "admin"), ctrl.createSociety);
router.get("/:id", ctrl.getSociety);
router.patch("/:id", authorize("super_admin", "admin"), sameSociety, ctrl.updateSociety);

router.get("/:id/members", authorize("super_admin", "admin"), sameSociety, ctrl.getMembers);
router.patch("/:id/members/:userId", authorize("super_admin", "admin"), sameSociety, ctrl.updateMember);

module.exports = router;