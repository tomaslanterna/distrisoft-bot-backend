const express = require("express");
const {
  createInspectionController,
  verifyInspectionController,
  confirmInspectionController,
  getInspectionsByTypeController,
  getInspectionByPlateController,
  updateInspectionStatusController,
  getInspectionsByFilterController,
  getReinspectionsByFilterController,
} = require("../controllers/inspection.controller");

const router = express.Router();

router.post("/create", createInspectionController);
router.post("/verify/:id", verifyInspectionController);
router.post("/confirm/:id", confirmInspectionController);
router.get("/type/:type", getInspectionsByTypeController);
router.get("/plate/:plate", getInspectionByPlateController);
// User requested separate endpoints status update
router.post("/status/:id", updateInspectionStatusController);

router.get("/filter", getInspectionsByFilterController);
router.get("/reinspections/filter", getReinspectionsByFilterController);

module.exports = router;
