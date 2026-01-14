const express = require("express");
const {
  updateVehicleStatusController,
  getVehiclesByStatusController,
} = require("../controllers/vehicle.controller");

const router = express.Router();

router.post("/status/:id", updateVehicleStatusController);
router.get("/list/:status", getVehiclesByStatusController);

module.exports = router;
