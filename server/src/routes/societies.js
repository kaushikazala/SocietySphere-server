const express = require("express");
const router = express.Router();
const { protect, authorize, sameSociety } = require("../middlewares/auth");
const ctrl = require("../controllers/societyController");

router.get("/code/:code", ctrl.getSocietyByCode); // public — used during signup

router.use(protect);

router.get("/", authorize("super_admin", "admin"), ctrl.listSocieties);
router.post("/", authorize("super_admin"), ctrl.createSociety);
router.get(
  "/:id",
  authorize("super_admin", "admin", "resident", "guard", "maintenance"),
  sameSociety,
  ctrl.getSociety
);
router.patch("/:id", authorize("super_admin", "admin"), sameSociety, ctrl.updateSociety);
router.delete("/:id", authorize("super_admin"), ctrl.deleteSociety);

router.get("/:id/members", authorize("super_admin", "admin"), sameSociety, ctrl.getMembers);
router.post("/:id/members", authorize("super_admin", "admin"), sameSociety, ctrl.createMember);
router.patch("/:id/members/:userId", authorize("super_admin", "admin"), sameSociety, ctrl.updateMember);
router.delete("/:id/members/:userId", authorize("super_admin", "admin"), sameSociety, ctrl.deleteMember);

module.exports = router;