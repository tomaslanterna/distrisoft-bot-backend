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
  updateReinspectionStateController,
} = require("../controllers/inspection.controller");
const isTechnician = require("../middlewares/isTechnician.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

const { uploadMiddleware } = require("../middlewares/uploadMiddlewares");

const router = express.Router();

router.post("/create", uploadMiddleware, createInspectionController);
router.post("/verify/:id", verifyInspectionController);
router.post("/confirm/:id", confirmInspectionController);
router.get("/type/:type", getInspectionsByTypeController);
router.get("/plate/:plate", getInspectionByPlateController);
// User requested separate endpoints status update
router.post("/status/:id", updateInspectionStatusController);

router.get("/filter", getInspectionsByFilterController);
router.get("/reinspections/filter", getReinspectionsByFilterController);

// Technician routes
router.put(
  "/reinspections/:id",
  authMiddleware,
  isTechnician,
  updateReinspectionStateController,
);

module.exports = router;
