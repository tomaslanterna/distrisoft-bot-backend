const express = require("express");
const {
  updateDistributor,
  getDistributorOrders,
} = require("../controllers/distributorController");

const router = express.Router();

router.post("/update", updateDistributor);
router.get("/orders", getDistributorOrders);

module.exports = router;
