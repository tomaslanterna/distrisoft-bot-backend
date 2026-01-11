const express = require("express");
const {
  createInspectionController,
  verifyInspectionController,
  confirmInspectionController,
  getInspectionsByTypeController,
} = require("../controllers/inspection.controller");

const router = express.Router();

router.post("/create", createInspectionController);
router.post("/verify/:id", verifyInspectionController);
router.post("/confirm/:id", confirmInspectionController);
router.get("/type/:type", getInspectionsByTypeController);

module.exports = router;
