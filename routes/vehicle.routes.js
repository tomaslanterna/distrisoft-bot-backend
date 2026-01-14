const express = require("express");
const {
  updateVehicleStatusController,
} = require("../controllers/vehicle.controller");

const router = express.Router();

router.post("/status/:id", updateVehicleStatusController);

module.exports = router;
