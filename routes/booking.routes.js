const express = require("express");
const router = express.Router();
const {
  createBookingController,
  getBookingsByDistributorController,
  updateBookingController,
} = require("../controllers/booking.controller");

router.post("/", createBookingController);
router.get("/:distributorId", getBookingsByDistributorController);
router.put("/update", updateBookingController);

module.exports = router;
