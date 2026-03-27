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
  analyzePhotosController,
  proxyImageController,
} = require("../controllers/inspection.controller");
const isTechnician = require("../middlewares/isTechnician.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require("multer");

const { uploadMiddleware } = require("../middlewares/uploadMiddlewares");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/create", uploadMiddleware, createInspectionController);
router.post(
  "/analyze-photos",
  authMiddleware,
  upload.fields([
    { name: "photos", maxCount: 20 },
    { name: "audio", maxCount: 1 },
  ]),
  analyzePhotosController,
);
router.post("/verify/:id", verifyInspectionController);
router.post("/confirm/:id", confirmInspectionController);

router.get("/type/:type", getInspectionsByTypeController);
router.get("/plate/:plate", getInspectionByPlateController);
// User requested separate endpoints status update
router.post("/status/:id", updateInspectionStatusController);

// Technician routes
router.put(
  "/reinspections/:id",
  authMiddleware,
  isTechnician,
  updateReinspectionStateController,
);

module.exports = router;
