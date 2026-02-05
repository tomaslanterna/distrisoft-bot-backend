const express = require("express");
const {
  updateVehicleStatusController,
  getVehiclesByStatusController,
  getVehiclesByFilterController,
} = require("../controllers/vehicle.controller");

const router = express.Router();

router.post("/status/:id", updateVehicleStatusController);
router.get("/list/:status", getVehiclesByStatusController);
router.get("/filter", getVehiclesByFilterController);

module.exports = router;
